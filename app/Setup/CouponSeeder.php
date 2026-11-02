<?php

namespace Kirki\Ecommerce\App\Setup;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

defined('ABSPATH') || exit;

/**
 * Seeds the starter coupons that come with the sample data.
 *
 * @since 1.0.0
 */
class CouponSeeder extends Seeder
{
    /**
     * Create each starter coupon whose code is not taken yet, inactive.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        foreach (OnBoardingCatalog::get_coupons() as $coupon) {
            if (Coupon::query()->where('code', $coupon['code'])->exists()) {
                continue;
            }

            Coupon::create(array_merge($coupon, [
                'is_active' => false,
                'start_datetime' => Date::now(),
                'created_by' => get_current_user_id() ?: null,
                'updated_by' => get_current_user_id() ?: null,
            ]));

            Log::info(sprintf('OnBoarding CouponSeeder created the %s coupon', $coupon['code']));
        }
    }
}
