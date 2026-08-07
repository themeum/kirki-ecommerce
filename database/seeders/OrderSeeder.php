<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\Facades\Order;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

class OrderSeeder extends Seeder
{
    /**
     * Seed a sample order linked to catalog products and coupons.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        $customer = SeedCatalog::get_customers()[9];
        $products = SeedCatalog::get_products();

        $data = CreateOrderPayloadDTO::from_array([
            'items' => [
                [
                    'variant_id' => 1,
                    'quantity' => 1,
                ],
                [
                    'variant_id' => 7,
                    'quantity' => 1,
                ],
            ],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'coupon_code' => 'WINTER20',
            'shipping_method' => 'method-0001',
            'shipping_first_name' => $customer['first_name'],
            'shipping_last_name' => $customer['last_name'],
            'shipping_address_line1' => 'House 12, Road 5, Block C',
            'shipping_address_line2' => 'Banani',
            'shipping_city' => 'Dhaka',
            'shipping_state' => '771',
            'shipping_postcode' => '1213',
            'shipping_country' => 'BD',
            'shipping_phone' => $customer['phone'],
            'shipping_email' => $customer['email'],
            'shipping_company' => null,
            'billing_first_name' => $customer['first_name'],
            'billing_last_name' => $customer['last_name'],
            'billing_address_line1' => 'House 12, Road 5, Block C',
            'billing_address_line2' => 'Banani',
            'billing_city' => 'Dhaka',
            'billing_state' => '771',
            'billing_postcode' => '1213',
            'billing_country' => 'BD',
            'billing_phone' => $customer['phone'],
            'billing_email' => $customer['email'],
            'billing_company' => null,
            'customer_email' => $customer['email'],
            'customer_phone' => $customer['phone'],
            'customer_notes' => 'Please deliver between 10 AM and 6 PM. Order includes '
                . $products[0]['title'] . ' and ' . $products[1]['title'] . '.',
            'customer_id' => 10,
            'is_manual' => 1,
        ]);

        Order::create($data);

        Log::info('OrderSeeder run successfully');
    }
}
