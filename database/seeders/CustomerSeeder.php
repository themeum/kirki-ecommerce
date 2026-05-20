<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Facades\Log;

use function Kirki\Ecommerce\faker;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $faker = faker();

        for ($i = 0; $i < 10; $i++) {
            $is_shipping_same_as_billing = $faker->boolean();
            $data = $this->make_customer_data($faker);

            $shipping_address = $this->make_address_data($faker, [
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'],
                'type' => AddressType::SHIPPING,
            ]);

            if ($is_shipping_same_as_billing) {
                $billing_address = $shipping_address;
                $billing_address['type'] = AddressType::BILLING;
            } else {
                $billing_address = $this->make_address_data($faker, [
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'phone' => $data['phone'],
                    'type' => AddressType::BILLING,
                ]);
            }

            $customer = Customer::create($data);
            $customer->shipping_address()->insert($shipping_address);
            $customer->billing_address()->insert($billing_address);
        }

        Log::info('CustomerSeeder run successfully');
    }

    protected function make_customer_data($faker)
    {
        $gender = $faker->randomElement(['male', 'female']);

        return [
            'first_name' => $faker->firstName($gender),
            'last_name' => $faker->lastName($gender),
            'email' => $faker->email(),
            'phone' => $faker->phoneNumber(),
            'tags' => implode(',', $faker->words(4)),
            'note' => $faker->sentence(10),
        ];
    }

    protected function make_address_data($faker, $customer)
    {
        return [
            'first_name' => $customer['first_name'],
            'last_name' => $customer['last_name'],
            'email' => $faker->email(),
            'phone' => $customer['phone'] ?? $faker->phoneNumber(),
            'address_line1' => $faker->address(),
            'address_line2' => $faker->secondaryAddress(),
            'city' => $faker->city(),
            'state' => $faker->state(),
            'country' => $faker->country(),
            'postal_code' => $faker->postcode(),
            'type' => $customer['type'],
        ];
    }
}
