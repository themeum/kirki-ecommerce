<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Facades\Log;

class CouponSeeder extends Seeder
{
    /**
     * Seed curated coupons with deterministic relationships.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        foreach (SeedCatalog::get_coupons() as $coupon_data) {
            $product_ids = $coupon_data['product_ids'];
            $category_ids = $coupon_data['category_ids'];
            $customer_ids = $coupon_data['customer_ids'];

            unset($coupon_data['product_ids'], $coupon_data['category_ids'], $coupon_data['customer_ids']);

            $coupon = Coupon::create($coupon_data);

            if ($coupon_data['customer_eligibility'] === 'specific-customers' && !empty($customer_ids)) {
                $coupon->customers()->sync($customer_ids);
            }

            if ($coupon_data['eligible_item_type'] === 'specific-products' && !empty($product_ids)) {
                $coupon->products()->sync($product_ids);
            } elseif ($coupon_data['eligible_item_type'] === 'specific-categories' && !empty($category_ids)) {
                $coupon->categories()->sync($category_ids);
            }
        }

        Log::info('CouponSeeder run successfully');
    }
}
