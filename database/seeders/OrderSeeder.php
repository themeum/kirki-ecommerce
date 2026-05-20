<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\Facades\Order;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Facades\Log;
use Faker\Generator;
use function Kirki\Ecommerce\faker;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $faker = faker();

        $data = $this->make_order_data($faker);

        Order::create($data);

        Log::info('OrderSeeder run successfully');
    }

    protected function make_order_data(Generator $faker)
    {
        $data = [
            'items' => [
                [
                    'variant_id' => 1,
                    'quantity' => 2
                ],
                [
                    'variant_id' => 7,
                    'quantity' => 3
                ]
            ],
            'currency_code' => 'USD',
            "payment_method" => "stripe",
            "coupon_code" => "WINTER20",

            "shipping_method" => "method-0001",

            "shipping_first_name" => $faker->firstName('male'),
            "shipping_last_name" => $faker->lastName('male'),
            "shipping_address_line1" => $faker->address(),
            "shipping_address_line2" => $faker->secondaryAddress(),
            "shipping_city" => $faker->city(),
            "shipping_state" => "771",
            "shipping_postcode" => $faker->postcode(),
            "shipping_country" => 'BD',
            "shipping_phone" => $faker->phoneNumber(),
            "shipping_email" => $faker->email(),
            "shipping_company" => $faker->company(),

            "billing_first_name" => $faker->firstName('female'),
            "billing_last_name" => $faker->lastName('female'),
            "billing_address_line1" => $faker->address(),
            "billing_address_line2" => $faker->secondaryAddress(),
            "billing_city" => $faker->city(),
            "billing_state" => '771',
            "billing_postcode" => $faker->postcode(),
            "billing_country" => 'BD',
            "billing_phone" => $faker->phoneNumber(),
            "billing_email" => $faker->email(),
            "billing_company" => $faker->company(),

            "customer_email" => $faker->email(),
            "customer_phone" => $faker->phoneNumber(),

            "customer_notes" => $faker->text(),
            'customer_id' => null,
            'is_manual' => 1,
        ];

        return CreateOrderPayloadDTO::from_array($data);
    }
}
