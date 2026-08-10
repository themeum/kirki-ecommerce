<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Str;

use function Kirki\Ecommerce\Framework\uuid;

class CartSeeder extends Seeder
{
    /**
     * Seed curated shopping carts for seeded customers.
     *
     * @return void
     * @since 1.0.0
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
                'expires_at' => date('Y-m-d H:i:s', strtotime('+7 days')),
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
