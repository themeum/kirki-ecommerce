<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\DiscountService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Discount\DiscountCalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\ProductTaxContextDTO;
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
        $result = new CalculationResultDTO();

        // Initialize totals as Money zero
        $total_subtotal_money = Money::zero();
        $total_tax_money = Money::zero();
        $total_discount_money = Money::zero();
        $total_grand_money = Money::zero();
        $total_product_amount_money = Money::zero();

        // Calculate Coupons & Discounts
        $discount_result = $this->get_discount_result($context);

        // Get Tax Settings & Strategy
        $tax_settings = Settings::get(OptionKeys::TAX_SETTINGS);
        $is_inclusive_tax = $tax_settings->get('is_tax_inclusive_price') ?? false;
        $tax_strategy = $context->should_calculate_tax ? Tax::get_tax_strategy($context->shipping_address) : null;

        // Iterate Items and Calculate Item Totals
        foreach ($context->items as $item) {
            $item_result = clone $item;

            $unit_price_money = Money::of_minor($item->base_unit_price);
            $unit_product_money = Money::of_minor($item->base_product_total);
            $item_net_total_money = $unit_price_money->multipliedBy($item->quantity);
            $item_product_total_money = $unit_product_money->multipliedBy($item->quantity);

            $item_discount_minor = $discount_result->item_discounts[$item->variant_id] ?? 0;
            $item_discount_money = Money::of_minor($item_discount_minor);

            // Cap discount at subtotal
            if ($item_discount_money->isGreaterThan($item_net_total_money)) {
                $item_discount_money = $item_net_total_money;
            }

            $item_total_money = $item_net_total_money->minus($item_discount_money);

            // Calculate Tax
            $tax_breakdown = [];
            $item_tax_amount_money = Money::zero();
            $tax_rate = 0;

            if ($tax_strategy) {
                $tax_context = new ProductTaxContextDTO([
                    'shipping_address' => $context->shipping_address,
                    'base_product_price' => $item_total_money->getMinorAmount()->toInt(),
                    'product_categories' => $item->product_categories,
                    'tax_profile' => $item->tax_profile_id
                ]);

                $tax_result = $tax_strategy->calculate_product_tax($tax_context);
                $item_tax_amount_money = Money::of_minor($tax_result->base_total);
                $tax_breakdown = $tax_result->breakdown;
                $tax_rate = collection($tax_result->breakdown)->sum(fn($item) => $item->rate);
            }

            if (!$is_inclusive_tax) {
                $item_total_money = $item_total_money->plus($item_tax_amount_money);
            }

            // Populate Item Result
            $item_result->base_subtotal = $item_net_total_money->getMinorAmount()->toInt();
            $item_result->base_tax_amount = $item_tax_amount_money->getMinorAmount()->toInt();
            $item_result->tax_rate = $tax_rate;
            $item_result->tax_breakdown = $tax_breakdown;
            $item_result->base_discount_amount = $item_discount_money->getMinorAmount()->toInt();
            $item_result->base_total = $item_total_money->getMinorAmount()->toInt();
            $item_result->base_product_total = $item_product_total_money->getMinorAmount()->toInt();

            // Aggregate Cart Totals
            $result->items[$item->variant_id] = $item_result;

            $total_subtotal_money = $total_subtotal_money->plus($item_net_total_money);
            $total_tax_money = $total_tax_money->plus($item_tax_amount_money);
            $total_discount_money = $total_discount_money->plus($item_discount_money);
            $total_grand_money = $total_grand_money->plus($item_total_money);
            $total_product_amount_money = $total_product_amount_money->plus($item_product_total_money);

            $result->items_count += $item->quantity;
        }

        // Calculate Shipping
        $shipping_subtotal_int = $this->get_shipping_total($context);
        $shipping_subtotal_money = Money::of_minor($shipping_subtotal_int);

        $shipping_discount_money = $discount_result->is_free_shipping ? $shipping_subtotal_money : Money::zero();

        $this->attribute_shipping_discount($discount_result, $shipping_discount_money->getMinorAmount()->toInt());

        $total_discount_money = $total_discount_money->plus($shipping_discount_money);

        // Calculate Shipping Tax
        $shipping_tax_money = Money::zero();

        if ($tax_strategy && $this->is_shipping_method_taxable($context)) {
            $shipping_taxable_money = $shipping_subtotal_money->minus($shipping_discount_money);
            $shipping_tax_result = $tax_strategy->calculate_shipping_tax($shipping_taxable_money->getMinorAmount()->toInt());
            $shipping_tax_money = Money::of_minor($shipping_tax_result->base_total);
        }

        // Shipping Total
        $shipping_total_money = $shipping_subtotal_money->minus($shipping_discount_money);

        if (!$is_inclusive_tax) {
            $shipping_total_money = $shipping_total_money->plus($shipping_tax_money);
        }

        $total_tax_money = $total_tax_money->plus($shipping_tax_money);
        $total_grand_money = $total_grand_money->plus($shipping_total_money);

        if ($total_grand_money->isLessThan(0)) {
            $total_grand_money = Money::zero();
        }

        // Set DTO values (convert back to int)
        $result->base_subtotal = $total_subtotal_money->getMinorAmount()->toInt();
        $result->base_tax_total = $total_tax_money->getMinorAmount()->toInt();
        $result->base_discount_total = $total_discount_money->getMinorAmount()->toInt();
        $result->coupon_results = $discount_result->coupon_results;
        $result->base_total = $total_grand_money->getMinorAmount()->toInt();

        $result->base_shipping_subtotal = $shipping_subtotal_money->getMinorAmount()->toInt();
        $result->base_shipping_discount = $shipping_discount_money->getMinorAmount()->toInt();
        $result->base_shipping_tax = $shipping_tax_money->getMinorAmount()->toInt();
        $result->base_shipping_total = $shipping_total_money->getMinorAmount()->toInt();
        $result->base_product_total = $total_product_amount_money->getMinorAmount()->toInt();

        return $result;
    }

    protected function get_discount_result(CalculationContextDTO $context): DiscountCalculationResultDTO
    {
        $coupons = $this->resolve_coupons($context->coupons);

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

    /**
     * Attribute the shipping discount to the first free-shipping coupon result
     * so it isn't double-counted if more than one free-shipping coupon is
     * (redundantly) applied at once.
     *
     * @param DiscountCalculationResultDTO $discount_result
     * @param int $shipping_discount_amount
     */
    protected function attribute_shipping_discount(DiscountCalculationResultDTO $discount_result, int $shipping_discount_amount)
    {
        $attributed = false;

        foreach ($discount_result->coupon_results as $coupon_result) {
            if ($coupon_result->coupon->discount_type !== DiscountType::FREE_SHIPPING) {
                continue;
            }

            if ($attributed) {
                $coupon_result->shipping_discount = 0;
                continue;
            }

            $coupon_result->shipping_discount = $shipping_discount_amount;
            $coupon_result->total_discount = $shipping_discount_amount;
            $attributed = true;
        }
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
}
