<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Facades\Log;

use function Kirki\Ecommerce\faker;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        $faker = faker();

        for ($i = 1; $i <= 20; $i++) {
            $data = $this->make_coupon_data($faker);
            $coupon = Coupon::create($data);

            if ($data['customer_eligibility'] === 'specific-customers') {
                $customer_ids = $faker->randomElements(range(1, 10), $faker->numberBetween(2, 5));
                $coupon->customers()->sync($customer_ids);
            }

            if ($data['eligible_item_type'] === 'specific-products') {
                $product_ids = $faker->randomElements(range(1, 10), $faker->numberBetween(2, 5));
                $coupon->products()->sync($product_ids);
            } elseif ($data['eligible_item_type'] === 'specific-categories') {
                $category_ids = $faker->randomElements(range(1, 10), $faker->numberBetween(1, 3));
                $coupon->categories()->sync($category_ids);
            }
        }

        Log::info('CouponSeeder run successfully');
    }

    protected function make_coupon_data($faker)
    {
        $method = $faker->randomElement(['code', 'automatic']);
        $discount_type = $faker->randomElement(['amount-off', 'free-shipping', 'buy-x-get-y']);
        $discount_value_type = $discount_type === 'free-shipping' ? null : $faker->randomElement(['percentage', 'fixed']);
        $has_end_date = $faker->boolean(70);
        $has_usage_limit = $faker->boolean(60);
        $has_customer_limit = $faker->boolean(80);
        $first_time_buyer_only = $faker->boolean(20);
        $customer_eligibility = $faker->randomElement(['all', 'specific-customers']);

        $code = $method === 'code' ? strtoupper($faker->lexify('??????')) . $faker->numberBetween(10, 99) : null;

        $discount_target = $discount_type === 'free-shipping' ? null : $faker->randomElement(['order', 'products']);

        $discount_amount_percentage = null;
        $discount_amount_fixed = null;
        if ($discount_value_type === 'percentage') {
            $discount_amount_percentage = $faker->randomElement([5, 10, 15, 20, 25, 30, 40, 50, 75, 100]);
        } elseif ($discount_value_type === 'fixed') {
            $discount_amount_fixed = $faker->randomElement([500, 1000, 1500, 2000, 2500, 3000, 5000, 10000]);
        }

        $eligible_item_type = $faker->randomElement(['specific-products', 'specific-categories', 'all-products']);

        $spend_condition_type = $faker->boolean(70) ? $faker->randomElement(['min-cart-amount', 'min-items']) : null;
        $spend_condition_value = $spend_condition_type ? ($spend_condition_type === 'min-cart-amount' ? $faker->randomElement([1000, 2000, 3000, 5000, 10000, 15000]) : $faker->numberBetween(1, 5)) : null;

        $reward_quantity = $discount_type === 'buy-x-get-y' ? $faker->numberBetween(1, 3) : null;
        $reward_value = $discount_type === 'buy-x-get-y' ? $faker->randomElement([50, 75, 100]) : null;

        $start_date = $faker->dateTimeBetween('-1 month', '+1 month')->format('Y-m-d');
        $end_date = $has_end_date ? $faker->dateTimeBetween('+1 month', '+6 months')->format('Y-m-d') : null;

        $target_countries = $faker->boolean(30) ? json_encode($faker->randomElements(['US', 'CA', 'GB', 'AU', 'NZ', 'DE', 'FR', 'IT', 'ES'], $faker->numberBetween(1, 4))) : null;

        return [
            'method' => $method,
            'title' => $faker->catchPhrase() . ' ' . $faker->randomElement(['Sale', 'Discount', 'Offer', 'Deal', 'Promotion']),
            'code' => $code,
            'discount_type' => $discount_type,
            'discount_target' => $discount_target,
            'discount_value_type' => $discount_value_type,
            'discount_amount_percentage' => $discount_amount_percentage,
            'discount_amount_fixed' => $discount_amount_fixed,
            'eligible_item_type' => $eligible_item_type,
            'spend_condition_type' => $spend_condition_type,
            'spend_condition_value' => $spend_condition_value,
            'reward_quantity' => $reward_quantity,
            'reward_value' => $reward_value,
            'start_date' => $start_date,
            'start_time' => $faker->boolean(50) ? $faker->time('H:i:s') : null,
            'has_end_date' => $has_end_date,
            'end_date' => $end_date,
            'end_time' => $has_end_date && $faker->boolean(50) ? $faker->time('H:i:s') : null,
            'target_countries' => $target_countries,
            'first_time_buyer_only' => $first_time_buyer_only,
            'customer_eligibility' => $customer_eligibility,
            'exclude_customers' => $faker->boolean(10),
            'has_usage_limit' => $has_usage_limit,
            'usage_limit' => $has_usage_limit ? $faker->randomElement([50, 100, 200, 500, 1000, 2000]) : null,
            'has_customer_limit' => $has_customer_limit,
            'customer_limit' => $has_customer_limit ? $faker->randomElement([1, 2, 3, 5, 10]) : null,
            'current_usage_count' => $faker->numberBetween(0, 50),
            'is_active' => $faker->boolean(85),
            'created_by' => 1,
        ];
    }
}
