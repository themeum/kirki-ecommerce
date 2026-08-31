<?php

namespace Kirki\Ecommerce\App\Resources\Concerns;

use Kirki\Ecommerce\App\Facades\Money;

/**
 * Shapes a live CalculationResultDTO::$coupon_results into the API's `coupons`
 * array. Shared by CartResource and OrderCalculationResource, which both
 * render an in-progress (not yet persisted) discount calculation.
 */
trait FormatsCouponResults
{
    protected function format_coupon_results(array $coupon_results, $base_currency_code, $display_currency)
    {
        return array_map(function ($coupon_result) use ($base_currency_code, $display_currency) {
            $coupon = $coupon_result->coupon;

            return [
                'code' => $coupon->code,
                'title' => $coupon->title,
                'discount_type' => $coupon->discount_type,
                'discount_target' => $coupon->discount_target,
                'discount_value_type' => $coupon->discount_value_type,
                'discount_amount_percentage' => $coupon->discount_amount_percentage,
                'base_discount_amount_fixed' => $coupon->base_discount_amount_fixed,
                'base_discount_amount' => Money::prepare_amount_from_minor($coupon_result->total_discount, $base_currency_code),
                'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($coupon_result->total_discount, $base_currency_code),
                'display_discount_amount' => Money::prepare_amount_from_minor($coupon_result->total_discount, $base_currency_code, $display_currency),
                'display_discount_amount_money_object' => Money::prepare_amount_object_from_minor($coupon_result->total_discount, $base_currency_code, $display_currency),
            ];
        }, $coupon_results);
    }
}
