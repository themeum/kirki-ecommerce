<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Str;

use function Kirki\Ecommerce\Framework\uuid;

/**
 * Seeds one active cart for each of a few seeded customers.
 *
 * @since 1.0.0
 */
class CartSeeder extends Seeder
{
    /**
     * Seed curated shopping carts for seeded customers.
     *
     * Creates a cart with two variants of product 1 for customers 1, 3 and 5.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        $customer_ids = [1, 3, 5];

        foreach ($customer_ids as $customer_id) {
            $cart = Cart::create([
                'customer_id' => $customer_id,
                'cart_token' => uuid(),
                'currency_code' => 'USD',
                'base_currency_code' => 'USD',
                'items_count' => 2,
                'expires_at' => gmdate('Y-m-d H:i:s', strtotime('+7 days')),
            ]);

            $cart->items()->create_many([
                [
                    'product_id' => 1,
                    'variant_id' => 1,
                    'quantity' => 1,
                ],
                [
                    'product_id' => 1,
                    'variant_id' => 2,
                    'quantity' => 1,
                ],
            ]);
        }

        Log::info('CartSeeder run successfully');
    }
}
