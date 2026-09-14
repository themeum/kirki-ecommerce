<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\DiscountService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Discount\DiscountCalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxableItemDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Tax\TaxCalculationResultDTO;
use Kirki\Ecommerce\App\Supports\Tax;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\Framework\collection;

class RecalculateCartAction
{
    protected $shipping_service;
    protected $discount_service;
    protected $coupon_service;
    protected $cart_service;

    public function __construct(
        ShippingService $shipping_service,
        DiscountService $discount_service,
        CouponService $coupon_service,
        CartService $cart_service
    ) {
        $this->shipping_service = $shipping_service;
        $this->discount_service = $discount_service;
        $this->coupon_service = $coupon_service;
        $this->cart_service = $cart_service;
    }

    public function execute(CalculationContextDTO $context): CalculationResultDTO
    {
        $context->shipping_subtotal = $this->get_shipping_total($context);

        $discount_result = $this->get_discount_result($context);
        $tax_result = $this->get_tax_result($context, $discount_result);
        $is_inclusive_tax = $this->is_tax_inclusive_price();

        $items = [];
        $items_count = 0;

        foreach ($context->items as $item) {
            $items[$item->variant_id] = $this->build_item_result($item, $discount_result, $tax_result, $is_inclusive_tax);
            $items_count += $item->quantity;
        }

        $shipping = $this->build_shipping_result($context, $discount_result, $tax_result, $is_inclusive_tax);

        return $this->aggregate($items, $items_count, $shipping, $discount_result);
    }

    protected function get_discount_result(CalculationContextDTO $context): DiscountCalculationResultDTO
    {
        $coupons = $this->resolve_coupons($context->coupon_codes);

        $discount_result = $this->discount_service->calculate($context, $coupons);

        if ($context->cart_id && !empty($discount_result->invalid_coupons)) {
            $invalid_coupon_ids = collection($discount_result->invalid_coupons)->pluck('id')->to_array();

            $this->cart_service->remove_coupons($context->cart_id, $invalid_coupon_ids);
        }

        return $discount_result;
    }

    /**
     * Resolve coupon codes to Coupon models in a single query, silently
     * skipping codes that don't resolve to a coupon (e.g. an ad-hoc code
     * submitted for an order preview that doesn't exist) rather than failing
     * the whole calculation.
     *
     * @param string[] $codes
     * @return \Kirki\Ecommerce\App\Models\Coupon[]
     */
    protected function resolve_coupons(array $codes)
    {
        return $this->coupon_service->find_by_codes($codes)->all();
    }

    protected function get_shipping_total(CalculationContextDTO $context)
    {
        if (empty($context->shipping_address) || empty($context->shipping_method_id)) {
            return 0;
        }

        return $this->shipping_service->calculate($context);
    }

    protected function is_shipping_method_taxable(CalculationContextDTO $context)
    {
        if (empty($context->shipping_address) || empty($context->shipping_method_id)) {
            return false;
        }

        return $this->shipping_service->get_selected_shipping_method($context)['is_taxable'] ?? false;
    }

    protected function is_tax_inclusive_price(): bool
    {
        $tax_settings = Settings::get(OptionKeys::TAX_SETTINGS);

        return $tax_settings->get('is_tax_inclusive_price') ?? false;
    }

    /**
     * Calculate every tax line the cart accrues - per item and for shipping -
     * in one call, so a country's tax strategy always sees the whole cart.
     * Falls back to an empty result (every line zero) when tax isn't being
     * calculated at all, so callers never need to null-check it.
     */
    protected function get_tax_result(CalculationContextDTO $context, DiscountCalculationResultDTO $discount_result): TaxCalculationResultDTO
    {
        if (!$context->should_calculate_tax) {
            return new TaxCalculationResultDTO();
        }

        $tax_strategy = Tax::get_tax_strategy($context->shipping_address);

        if (!$tax_strategy) {
            return new TaxCalculationResultDTO();
        }

        return $tax_strategy->calculate($this->build_tax_context($context, $discount_result));
    }

    protected function build_tax_context(CalculationContextDTO $context, DiscountCalculationResultDTO $discount_result): TaxCalculationContextDTO
    {
        $shipping_taxable_money = Money::of_minor($context->shipping_subtotal)
            ->minus(Money::of_minor($discount_result->shipping_discount));

        $items = [];

        foreach ($context->items as $item) {
            $items[] = TaxableItemDTO::from_array([
                'item_id' => $item->variant_id,
                'taxable_amount' => $this->calculate_item_taxable_amount($item, $discount_result)->getMinorAmount()->toInt(),
                'tax_profile_id' => $item->tax_profile_id,
                'product_categories' => $item->product_categories,
            ]);
        }

        return TaxCalculationContextDTO::from_array([
            'shipping_address' => $context->shipping_address,
            'billing_address' => $context->billing_address,
            'shipping_fee' => $shipping_taxable_money->getMinorAmount()->toInt(),
            'is_shipping_taxable' => $this->is_shipping_method_taxable($context),
            'items' => $items,
        ]);
    }

    protected function calculate_item_net_total(CalculationItemDTO $item)
    {
        return Money::of_minor($item->base_unit_price)->multipliedBy($item->quantity);
    }

    /**
     * An item's discount, capped at its own subtotal so a discount can never
     * push an item's total below zero.
     */
    protected function calculate_item_discount(CalculationItemDTO $item, $item_net_total_money, DiscountCalculationResultDTO $discount_result)
    {
        $item_discount_money = Money::of_minor($discount_result->item_discounts[$item->variant_id] ?? 0);

        if ($item_discount_money->isGreaterThan($item_net_total_money)) {
            return $item_net_total_money;
        }

        return $item_discount_money;
    }

    protected function calculate_item_taxable_amount(CalculationItemDTO $item, DiscountCalculationResultDTO $discount_result)
    {
        $net_total_money = $this->calculate_item_net_total($item);
        $discount_money = $this->calculate_item_discount($item, $net_total_money, $discount_result);

        return $net_total_money->minus($discount_money);
    }

    /**
     * @param \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[] $tax_lines
     */
    protected function sum_tax_amount(array $tax_lines)
    {
        $total = Money::zero();

        foreach ($tax_lines as $tax_line) {
            $total = $total->plus(Money::of_minor($tax_line->base_amount));
        }

        return $total;
    }

    protected function build_item_result(CalculationItemDTO $item, DiscountCalculationResultDTO $discount_result, TaxCalculationResultDTO $tax_result, bool $is_inclusive_tax): CalculationItemDTO
    {
        $item_result = clone $item;

        $net_total_money = $this->calculate_item_net_total($item);
        $discount_money = $this->calculate_item_discount($item, $net_total_money, $discount_result);
        $product_total_money = Money::of_minor($item->base_product_total)->multipliedBy($item->quantity);

        $tax_lines = $tax_result->items[$item->variant_id] ?? [];
        $tax_amount_money = $this->sum_tax_amount($tax_lines);

        $item_total_money = $net_total_money->minus($discount_money);

        if (!$is_inclusive_tax) {
            $item_total_money = $item_total_money->plus($tax_amount_money);
        }

        $item_result->base_subtotal = $net_total_money->getMinorAmount()->toInt();
        $item_result->base_tax_amount = $tax_amount_money->getMinorAmount()->toInt();
        $item_result->tax_lines = $tax_lines;
        $item_result->base_discount_amount = $discount_money->getMinorAmount()->toInt();
        $item_result->base_total = $item_total_money->getMinorAmount()->toInt();
        $item_result->base_product_total = $product_total_money->getMinorAmount()->toInt();

        return $item_result;
    }

    /**
     * @return array{subtotal: int, discount: int, tax: int, tax_lines: \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[], total: int}
     */
    protected function build_shipping_result(CalculationContextDTO $context, DiscountCalculationResultDTO $discount_result, TaxCalculationResultDTO $tax_result, bool $is_inclusive_tax): array
    {
        $subtotal_money = Money::of_minor($context->shipping_subtotal);
        $discount_money = Money::of_minor($discount_result->shipping_discount);
        $tax_lines = $tax_result->shipping;
        $tax_money = $this->sum_tax_amount($tax_lines);

        $total_money = $subtotal_money->minus($discount_money);

        if (!$is_inclusive_tax) {
            $total_money = $total_money->plus($tax_money);
        }

        return [
            'subtotal' => $subtotal_money->getMinorAmount()->toInt(),
            'discount' => $discount_money->getMinorAmount()->toInt(),
            'tax' => $tax_money->getMinorAmount()->toInt(),
            'tax_lines' => $tax_lines,
            'total' => $total_money->getMinorAmount()->toInt(),
        ];
    }

    /**
     * @param array<int, CalculationItemDTO> $items
     * @param array{subtotal: int, discount: int, tax: int, tax_lines: \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[], total: int} $shipping
     */
    protected function aggregate(array $items, int $items_count, array $shipping, DiscountCalculationResultDTO $discount_result): CalculationResultDTO
    {
        $result = new CalculationResultDTO();

        $result->items = $items;
        $result->items_count = $items_count;

        $result->base_subtotal = array_sum(array_column($items, 'base_subtotal'));
        $result->base_product_total = array_sum(array_column($items, 'base_product_total'));
        $result->base_discount_total = array_sum(array_column($items, 'base_discount_amount')) + $shipping['discount'];
        $result->base_tax_total = array_sum(array_column($items, 'base_tax_amount')) + $shipping['tax'];
        $result->coupon_results = $discount_result->coupon_results;
        $result->base_total = max(array_sum(array_column($items, 'base_total')) + $shipping['total'], 0);

        $result->base_shipping_subtotal = $shipping['subtotal'];
        $result->base_shipping_discount = $shipping['discount'];
        $result->base_shipping_tax = $shipping['tax'];
        $result->shipping_tax_lines = $shipping['tax_lines'];
        $result->base_shipping_total = $shipping['total'];

        return $result;
    }
}
