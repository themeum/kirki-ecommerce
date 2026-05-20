<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\DiscountService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Discount\DiscountCalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Tax\ProductTaxContextDTO;
use Kirki\Ecommerce\App\Tax\TaxStrategyFactory;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Supports\Facades\Settings;
use Kirki\Ecommerce\Supports\Facades\Money;
use Throwable;

use function Kirki\Ecommerce\collection;

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

        // Calculate Coupons & Discounts
        $discount_result = $this->get_discount_result($context);

        // Get Tax Settings & Strategy
        $tax_settings = Settings::get(OptionKeys::TAX_SETTINGS);
        $is_inclusive_tax = $tax_settings->get('is_tax_inclusive_price') ?? false;
        $tax_strategy = $this->get_tax_strategy($context->shipping_address);

        // Iterate Items and Calculate Item Totals
        foreach ($context->items as $item) {
            $item_result = clone $item;

            $unit_price_money = Money::of_minor($item->unit_price);
            $item_net_total_money = $unit_price_money->multipliedBy($item->quantity);

            $item_discount_minor = $discount_result->item_discounts[$item->variant_id] ?? 0;
            $item_discount_money = Money::of_minor($item_discount_minor);

            // Cap discount at subtotal
            if ($item_discount_money->isGreaterThan($item_net_total_money)) {
                $item_discount_money = $item_net_total_money;
            }

            $item_subtotal_money = $item_net_total_money->minus($item_discount_money);

            // Calculate Tax
            $tax_breakdown = [];
            $item_tax_amount_money = Money::zero();
            $tax_rate = 0;

            if ($tax_strategy) {
                $tax_context = new ProductTaxContextDTO([
                    'shipping_address' => $context->shipping_address,
                    'product_price' => $item_subtotal_money->getMinorAmount()->toInt(),
                    'product_categories' => $item->product_categories,
                    'tax_profile' => $item->tax_profile_id
                ]);

                $tax_result = $tax_strategy->calculate_product_tax($tax_context);
                $item_tax_amount_money = Money::of_minor($tax_result->total);
                $tax_breakdown = $tax_result->breakdown;
                $tax_rate = collection($tax_result->breakdown)->sum(fn($item) => $item->rate);
            }

            // Calculate Item Result Total
            $item_total_money = $item_subtotal_money;

            if (!$is_inclusive_tax) {
                $item_total_money = $item_total_money->plus($item_tax_amount_money);
            }

            // Populate Item Result
            $item_result->subtotal = $item_subtotal_money->getMinorAmount()->toInt();
            $item_result->tax_amount = $item_tax_amount_money->getMinorAmount()->toInt();
            $item_result->tax_rate = $tax_rate;
            $item_result->tax_breakdown = $tax_breakdown;
            $item_result->discount_amount = $item_discount_money->getMinorAmount()->toInt();
            $item_result->total = $item_total_money->getMinorAmount()->toInt();

            // Aggregate Cart Totals
            $result->items[$item->variant_id] = $item_result;

            $total_subtotal_money = $total_subtotal_money->plus($item_subtotal_money);
            $total_tax_money = $total_tax_money->plus($item_tax_amount_money);
            $total_discount_money = $total_discount_money->plus($item_discount_money);
            $total_grand_money = $total_grand_money->plus($item_total_money);

            $result->items_count += $item->quantity;
        }

        // Calculate Shipping
        $shipping_subtotal_int = $this->get_shipping_total($context);
        $shipping_subtotal_money = Money::of_minor($shipping_subtotal_int);

        $shipping_discount_money = $discount_result->is_free_shipping ? $shipping_subtotal_money : Money::zero();

        $total_discount_money = $total_discount_money->plus($shipping_discount_money);

        // Calculate Shipping Tax
        $shipping_tax_money = Money::zero();

        if ($tax_strategy) {
            $shipping_taxable_money = $shipping_subtotal_money->minus($shipping_discount_money);
            $shipping_tax_result = $tax_strategy->calculate_shipping_tax($shipping_taxable_money->getMinorAmount()->toInt());
            $shipping_tax_money = Money::of_minor($shipping_tax_result->total);
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
        $result->subtotal = $total_subtotal_money->getMinorAmount()->toInt();
        $result->tax_total = $total_tax_money->getMinorAmount()->toInt();
        $result->discount_total = $total_discount_money->getMinorAmount()->toInt();
        $result->discount_details = $discount_result->discount_details;
        $result->total = $total_grand_money->getMinorAmount()->toInt();

        $result->shipping_subtotal = $shipping_subtotal_money->getMinorAmount()->toInt();
        $result->shipping_discount = $shipping_discount_money->getMinorAmount()->toInt();
        $result->shipping_tax = $shipping_tax_money->getMinorAmount()->toInt();
        $result->shipping_total = $shipping_total_money->getMinorAmount()->toInt();

        return $result;
    }

    protected function get_discount_result(CalculationContextDTO $context)
    {
        try {
            $coupon_code = $context->coupon ?? null;
            $coupon = $coupon_code ? $this->coupon_service->find_by_code($coupon_code) : null;

            return $this->discount_service->calculate($context, $coupon);
        } catch (Throwable $e) {
            if ($context->cart_id) {
                $this->cart_service->partial_update($context->cart_id, ['discount_details' => null]);
            }

            return new DiscountCalculationResultDTO();
        }
    }

    protected function get_shipping_total(CalculationContextDTO $context)
    {
        if (empty($context->shipping_address) || empty($context->shipping_method_id)) {
            return 0;
        }

        return $this->shipping_service->calculate($context);
    }

    protected function get_tax_strategy($address)
    {
        if (empty($address)) {
            return null;
        }

        try {
            return TaxStrategyFactory::make($address);
        } catch (Throwable $e) {
            return null;
        }
    }
}
