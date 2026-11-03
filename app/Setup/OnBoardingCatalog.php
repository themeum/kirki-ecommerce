<?php

namespace Kirki\Ecommerce\App\Setup;

defined('ABSPATH') || exit;

/**
 * Static catalog of the starter coupon, loaded with the sample data.
 *
 * @since 1.0.0
 */
class OnBoardingCatalog
{
    /**
     * Starter coupons.
     *
     * Sample data loading creates each coupon whose code is not taken yet, and
     * creates it inactive, so the merchant decides when it goes live.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>> Coupon definitions with the stored coupon fields.
     */
    public static function get_coupons()
    {
        return [
            [
                'method' => 'code',
                'title' => 'Welcome 50% off',
                'code' => 'WELCOME50',
                'discount_type' => 'amount-off',
                'discount_target' => 'order',
                'discount_value_type' => 'percentage',
                'discount_amount_percentage' => 50,
                'eligible_item_type' => 'all-products',
                'has_end_datetime' => false,
                'target_country_type' => 'all-countries',
                'first_time_buyer_only' => false,
                'customer_include_eligibility' => 'everyone',
                'customer_exclude_eligibility' => 'none',
                'has_usage_limit' => false,
                'has_customer_limit' => false,
                'combinations' => [],
            ],
        ];
    }
}
