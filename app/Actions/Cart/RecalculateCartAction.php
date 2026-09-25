<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Brick\Math\RoundingMode;
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

/**
 * Calculates cart totals: item subtotals, coupon discounts, shipping and tax.
 *
 * @since 1.0.0
 */
class RecalculateCartAction
{
    /** @var ShippingService */
    protected $shipping_service;

    /** @var DiscountService */
    protected $discount_service;

    /** @var CouponService */
    protected $coupon_service;

    /** @var CartService */
    protected $cart_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param ShippingService $shipping_service Shipping cost and method calculator.
     * @param DiscountService $discount_service Coupon discount calculator.
     * @param CouponService   $coupon_service   Coupon lookup service.
     * @param CartService     $cart_service     Cart persistence service.
     */
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

    /**
     * Calculate the full totals for a cart or order preview.
     *
     * Sets the context's shipping subtotal as a side effect, and removes
     * coupons found invalid from the stored cart.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Items, addresses, shipping method and coupon codes to price.
     * @return CalculationResultDTO Per-item results plus subtotal, discount, tax, shipping and grand totals in base currency minor units.
     */
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

        $shipping = $this->build_shipping_result($context, $discount_result, $tax_result);

        return $this->aggregate($items, $items_count, $shipping, $discount_result);
    }

    /**
     * Calculate coupon discounts for the context.
     *
     * Coupons found invalid are also detached from the stored cart, when the context has one.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Calculation context.
     * @return DiscountCalculationResultDTO Item, shipping and per-coupon discounts.
     */
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
     * @since 1.0.0
     *
     * @param string[] $codes Coupon codes.
     * @return \Kirki\Ecommerce\App\Models\Coupon[] Matching coupons.
     */
    protected function resolve_coupons(array $codes)
    {
        return $this->coupon_service->find_by_codes($codes)->all();
    }

    /**
     * Get the shipping cost for the context's selected shipping method.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Calculation context.
     * @return int Shipping cost in base currency minor units; 0 until a shipping address and method are chosen.
     */
    protected function get_shipping_total(CalculationContextDTO $context)
    {
        if (empty($context->shipping_address) || empty($context->shipping_method_id)) {
            return 0;
        }

        return $this->shipping_service->calculate($context);
    }

    /**
     * Check whether the selected shipping method is taxable.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Calculation context.
     * @return bool False when no shipping address or method is selected.
     */
    protected function is_shipping_method_taxable(CalculationContextDTO $context)
    {
        if (empty($context->shipping_address) || empty($context->shipping_method_id)) {
            return false;
        }

        return $this->shipping_service->get_selected_shipping_method($context)['is_taxable'] ?? false;
    }

    /**
     * Check whether product prices in the store already include tax.
     *
     * @since 1.0.0
     *
     * @return bool The tax settings' is_tax_inclusive_price flag.
     */
    protected function is_tax_inclusive_price(): bool
    {
        $tax_settings = Settings::get(OptionKeys::TAX_SETTINGS);

        return $tax_settings->get('is_tax_inclusive_price') ?? false;
    }

    /**
     * Calculate every tax line the cart accrues, per item and for shipping.
     *
     * Runs in one call so a country's tax strategy always sees the whole cart.
     * Falls back to an empty result (every line zero) when tax isn't being
     * calculated at all, so callers never need to null-check it.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO        $context         Calculation context.
     * @param DiscountCalculationResultDTO $discount_result Discounts to deduct before taxing.
     * @return TaxCalculationResultDTO Tax lines per item and for shipping.
     */
    protected function get_tax_result(CalculationContextDTO $context, DiscountCalculationResultDTO $discount_result): TaxCalculationResultDTO
    {
        $should_calculate_tax = Tax::should_calculate_tax() && $context->should_calculate_tax;

        if (!$should_calculate_tax) {
            return new TaxCalculationResultDTO();
        }

        $tax_strategy = Tax::get_tax_strategy($context->shipping_address);

        if (!$tax_strategy) {
            return new TaxCalculationResultDTO();
        }

        return $tax_strategy->calculate($this->build_tax_context($context, $discount_result));
    }

    /**
     * Build the input for the tax strategy from the post-discount item and shipping amounts.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO        $context         Calculation context.
     * @param DiscountCalculationResultDTO $discount_result Discounts to deduct from taxable amounts.
     * @return TaxCalculationContextDTO Taxable items, shipping fee and addresses.
     */
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

    /**
     * Calculate an item's pre-discount total (unit price times quantity).
     *
     * @since 1.0.0
     *
     * @param CalculationItemDTO $item Cart item.
     * @return \Brick\Money\Money Line subtotal in base currency.
     */
    protected function calculate_item_net_total(CalculationItemDTO $item)
    {
        return Money::of_minor($item->base_unit_price)->multipliedBy($item->quantity);
    }

    /**
     * An item's discount, capped at its own subtotal so a discount can never
     * push an item's total below zero.
     *
     * @since 1.0.0
     *
     * @param CalculationItemDTO           $item                 Cart item.
     * @param \Brick\Money\Money           $item_net_total_money Item's pre-discount total.
     * @param DiscountCalculationResultDTO $discount_result      Discounts for the whole cart.
     * @return \Brick\Money\Money Discount applied to the item, never above its subtotal.
     */
    protected function calculate_item_discount(CalculationItemDTO $item, $item_net_total_money, DiscountCalculationResultDTO $discount_result)
    {
        $item_discount_money = Money::of_minor($discount_result->item_discounts[$item->variant_id] ?? 0);

        if ($item_discount_money->isGreaterThan($item_net_total_money)) {
            return $item_net_total_money;
        }

        return $item_discount_money;
    }

    /**
     * Calculate the amount of an item that is subject to tax.
     *
     * @since 1.0.0
     *
     * @param CalculationItemDTO           $item            Cart item.
     * @param DiscountCalculationResultDTO $discount_result Discounts for the whole cart.
     * @return \Brick\Money\Money Item subtotal after its discount.
     */
    protected function calculate_item_taxable_amount(CalculationItemDTO $item, DiscountCalculationResultDTO $discount_result)
    {
        $net_total_money = $this->calculate_item_net_total($item);
        $discount_money = $this->calculate_item_discount($item, $net_total_money, $discount_result);

        return $net_total_money->minus($discount_money);
    }

    /**
     * Sum the base amounts of the given tax lines.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[] $tax_lines Tax lines to add up.
     * @return \Brick\Money\Money Total tax in base currency.
     */
    protected function sum_tax_amount(array $tax_lines)
    {
        $total = Money::zero();

        foreach ($tax_lines as $tax_line) {
            $total = $total->plus(Money::of_minor($tax_line->base_amount));
        }

        return $total;
    }

    /**
     * Compute the tax on an item's regular-price total, at the same rate(s)
     * as its current-price tax lines.
     *
     * Unlike `sum_tax_amount()` (which sums tax lines already computed by the
     * tax strategy against the item's *current*, discounted taxable amount),
     * this applies each line's rate directly to a different, already-exclusive
     * base - the regular-price total - since that total was never itself
     * passed through the tax strategy. It's the same exclusive-basis
     * "tax added on top" formula `AbstractTaxStrategy::calculate_shipping_tax_amount()`
     * uses for shipping, valid here because `$exclusive_regular_total_money`
     * is always already tax-exclusive (see `item-pricing-tax-exclusivity`).
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[] $tax_lines                     The item's current-price tax lines (for their rates).
     * @param \Brick\Money\Money                        $exclusive_regular_total_money The item's regular-price total, tax-exclusive.
     * @return \Brick\Money\Money Tax on the regular-price total, in base currency.
     */
    protected function calculate_regular_tax_amount(array $tax_lines, $exclusive_regular_total_money)
    {
        $total = Money::zero();

        foreach ($tax_lines as $tax_line) {
            $total = $total->plus(
                $exclusive_regular_total_money->multipliedBy($tax_line->rate, RoundingMode::HALF_UP)->dividedBy(100, RoundingMode::HALF_UP)
            );
        }

        return $total;
    }

    /**
     * Build the priced copy of a cart item with subtotal, discount, tax and total filled in.
     *
     * In tax-inclusive mode the tax is not added on top of the item total. The
     * subtotal, unit price and regular unit price are always excluded of tax,
     * regardless of the store's tax-inclusive-price setting - see
     * exclude_tax().
     *
     * @since 1.0.0
     *
     * @param CalculationItemDTO           $item             Cart item to price.
     * @param DiscountCalculationResultDTO $discount_result  Discounts for the whole cart.
     * @param TaxCalculationResultDTO      $tax_result       Tax lines for the whole cart.
     * @param bool                         $is_inclusive_tax Whether prices already include tax.
     * @return CalculationItemDTO Cloned item with base_* amounts set.
     */
    protected function build_item_result(CalculationItemDTO $item, DiscountCalculationResultDTO $discount_result, TaxCalculationResultDTO $tax_result, bool $is_inclusive_tax): CalculationItemDTO
    {
        $item_result = clone $item;

        $net_total_money = $this->calculate_item_net_total($item);
        $discount_money = $this->calculate_item_discount($item, $net_total_money, $discount_result);
        $taxable_amount_money = $net_total_money->minus($discount_money);

        $tax_lines = $tax_result->items[$item->variant_id] ?? [];
        $tax_amount_money = $this->sum_tax_amount($tax_lines);

        $item_total_money = $taxable_amount_money;

        if (!$is_inclusive_tax) {
            $item_total_money = $item_total_money->plus($tax_amount_money);
        }

        $tax_fraction = $this->calculate_tax_fraction($tax_amount_money, $taxable_amount_money, $is_inclusive_tax);

        $exclusive_net_total_money = $this->exclude_tax($net_total_money, $tax_fraction);
        $exclusive_unit_price_money = $this->exclude_tax(Money::of_minor($item->base_unit_price), $tax_fraction);
        $exclusive_regular_unit_price_money = $this->exclude_tax(Money::of_minor($item->base_product_total), $tax_fraction);
        $product_total_money = $exclusive_regular_unit_price_money->multipliedBy($item->quantity);
        $regular_tax_amount_money = $this->calculate_regular_tax_amount($tax_lines, $product_total_money);

        $item_result->base_subtotal = $exclusive_net_total_money->getMinorAmount()->toInt();
        $item_result->base_tax_amount = $tax_amount_money->getMinorAmount()->toInt();
        $item_result->tax_lines = $tax_lines;
        $item_result->base_discount_amount = $discount_money->getMinorAmount()->toInt();
        $item_result->base_total = $item_total_money->getMinorAmount()->toInt();
        $item_result->base_product_total = $product_total_money->getMinorAmount()->toInt();
        $item_result->base_unit_price = $exclusive_unit_price_money->getMinorAmount()->toInt();
        $item_result->base_regular_unit_price = $exclusive_regular_unit_price_money->getMinorAmount()->toInt();
        $item_result->base_regular_tax_amount = $regular_tax_amount_money->getMinorAmount()->toInt();

        return $item_result;
    }

    /**
     * The fraction of a taxable amount that is embedded tax, under tax-inclusive pricing.
     *
     * @since 1.0.0
     *
     * @param \Brick\Money\Money $tax_amount_money     Tax already computed for the taxable amount.
     * @param \Brick\Money\Money $taxable_amount_money Amount the tax was computed against.
     * @param bool               $is_inclusive_tax     Whether prices already include tax.
     * @return float Fraction of the taxable amount that is tax; 0 under tax-exclusive pricing or when the taxable amount is zero.
     */
    protected function calculate_tax_fraction($tax_amount_money, $taxable_amount_money, bool $is_inclusive_tax): float
    {
        if (!$is_inclusive_tax || $taxable_amount_money->isZero()) {
            return 0.0;
        }

        return $tax_amount_money->getAmount()->toFloat() / $taxable_amount_money->getAmount()->toFloat();
    }

    /**
     * Exclude a proportional tax fraction from an amount.
     *
     * Reapplies the same fraction `calculate_tax_fraction()` derived from one
     * amount to any other amount taxed at the same rate composition, since
     * the fraction is scale-invariant.
     *
     * @since 1.0.0
     *
     * @param \Brick\Money\Money $amount_money Amount to exclude tax from.
     * @param float              $tax_fraction Fraction of the amount that is tax, from calculate_tax_fraction().
     * @return \Brick\Money\Money The amount, net of tax; unchanged when $tax_fraction is 0.
     */
    protected function exclude_tax($amount_money, float $tax_fraction)
    {
        if ($tax_fraction === 0.0) {
            return $amount_money;
        }

        return $amount_money->minus($amount_money->multipliedBy($tax_fraction, RoundingMode::HALF_UP));
    }

    /**
     * Build the shipping subtotal, discount, tax and total amounts.
     *
     * Shipping is never sold at a tax-inclusive price, so unlike item
     * totals, shipping tax is always added on top of the discounted
     * shipping subtotal, regardless of the store's tax-inclusive-price
     * setting for products.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO        $context         Calculation context.
     * @param DiscountCalculationResultDTO $discount_result Discounts for the whole cart.
     * @param TaxCalculationResultDTO      $tax_result      Tax lines for the whole cart.
     * @return array{subtotal: int, discount: int, tax: int, tax_lines: \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[], total: int}
     */
    protected function build_shipping_result(CalculationContextDTO $context, DiscountCalculationResultDTO $discount_result, TaxCalculationResultDTO $tax_result): array
    {
        $subtotal_money = Money::of_minor($context->shipping_subtotal);
        $discount_money = Money::of_minor($discount_result->shipping_discount);
        $tax_lines = $tax_result->shipping;
        $tax_money = $this->sum_tax_amount($tax_lines);

        $total_money = $subtotal_money->minus($discount_money)->plus($tax_money);

        return [
            'subtotal' => $subtotal_money->getMinorAmount()->toInt(),
            'discount' => $discount_money->getMinorAmount()->toInt(),
            'tax' => $tax_money->getMinorAmount()->toInt(),
            'tax_lines' => $tax_lines,
            'total' => $total_money->getMinorAmount()->toInt(),
        ];
    }

    /**
     * Combine the priced items and shipping amounts into the final calculation result.
     *
     * The grand total is floored at zero.
     *
     * @since 1.0.0
     *
     * @param array<int, CalculationItemDTO> $items           Priced items keyed by variant ID.
     * @param int                            $items_count     Total quantity across all items.
     * @param array<string, mixed>           $shipping        Shipping subtotal, discount, tax, tax_lines and total, as built by build_shipping_result().
     * @param DiscountCalculationResultDTO   $discount_result Discounts for the whole cart.
     * @return CalculationResultDTO Aggregated totals.
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
