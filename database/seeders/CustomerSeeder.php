<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

/**
 * Seeds the curated customers together with their shipping and billing addresses.
 *
 * @since 1.0.0
 */
class CustomerSeeder extends Seeder
{
    /**
     * Seed curated customer records with realistic addresses.
     *
     * Even-indexed customers get one address used for both shipping and billing;
     * the others get a separate billing address.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        foreach (SeedCatalog::get_customers() as $index => $customer_data) {
            $is_shipping_same_as_billing = $index % 2 === 0;

            $shipping_address = $this->make_address_data($customer_data, [
                'address_line1' => $this->get_address_line($index, 'shipping'),
                'city' => $this->get_city($index),
                'state' => $this->get_state($index),
                'country' => $this->get_country($index),
                'postal_code' => $this->get_postal_code($index),
                'is_default_shipping' => true,
                'is_default_billing' => $is_shipping_same_as_billing,
            ]);

            $addresses = [$shipping_address];

            if (!$is_shipping_same_as_billing) {
                $addresses[] = $this->make_address_data($customer_data, [
                    'address_line1' => $this->get_address_line($index, 'billing'),
                    'city' => $this->get_city($index + 1),
                    'state' => $this->get_state($index + 1),
                    'country' => $this->get_country($index),
                    'postal_code' => $this->get_postal_code($index + 1),
                    'is_default_billing' => true,
                ]);
            }

            $customer = Customer::create([
                'first_name' => $customer_data['first_name'],
                'last_name' => $customer_data['last_name'],
                'email' => $customer_data['email'],
                'phone' => $customer_data['phone'],
                'tags' => is_string($customer_data['tags']) ? explode(',', $customer_data['tags']) : $customer_data['tags'],
                'notes' => $customer_data['note'] ?? $customer_data['notes'] ?? null,
            ]);

            $customer->addresses()->create_many($addresses);
        }

        Log::info('CustomerSeeder run successfully');
    }

    /**
     * Build address data for a customer.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $customer  Customer record.
     * @param array<string, mixed> $overrides Address field overrides.
     * @return array<string, mixed> Address row with the customer's contact details and the overrides applied.
     */
    protected function make_address_data(array $customer, array $overrides)
    {
        return array_merge([
            'first_name' => $customer['first_name'],
            'last_name' => $customer['last_name'],
            'email' => $customer['email'],
            'phone' => $customer['phone'],
            'address_line1' => '',
            'address_line2' => null,
            'city' => '',
            'state' => '',
            'country' => '',
            'postal_code' => '',
            'type' => AddressType::HOME,
            'is_default_shipping' => false,
            'is_default_billing' => false,
        ], $overrides);
    }

    /**
     * Resolve street address by customer index.
     *
     * @since 1.0.0
     *
     * @param int    $index Customer index.
     * @param string $type  Address type; 'billing' prefixes the street with "Billing: ".
     * @return string Street address line.
     */
    protected function get_address_line($index, $type)
    {
        $addresses = [
            '742 Evergreen Terrace',
            '1600 Amphitheatre Parkway',
            '350 Fifth Avenue',
            '221B Baker Street',
            '10 Downing Street',
            '1 Infinite Loop',
            '233 S Wacker Drive',
            '1 Hacker Way',
            '600 Montgomery Street',
            'House 12, Road 5, Block C',
        ];

        $line = $addresses[$index % count($addresses)];

        if ($type === 'billing') {
            return 'Billing: ' . $line;
        }

        return $line;
    }

    /**
     * Resolve city by customer index.
     *
     * @since 1.0.0
     *
     * @param int $index Customer index.
     * @return string City name.
     */
    protected function get_city($index)
    {
        $cities = [
            'Springfield',
            'Mountain View',
            'New York',
            'London',
            'London',
            'Cupertino',
            'Chicago',
            'Menlo Park',
            'San Francisco',
            'Dhaka',
        ];

        return $cities[$index % count($cities)];
    }

    /**
     * Resolve state by customer index.
     *
     * @since 1.0.0
     *
     * @param int $index Customer index.
     * @return string State code.
     */
    protected function get_state($index)
    {
        $states = [
            'CA',
            'CA',
            'NY',
            'LND',
            'LND',
            'CA',
            'IL',
            'CA',
            'CA',
            '771',
        ];

        return $states[$index % count($states)];
    }

    /**
     * Resolve country by customer index.
     *
     * @since 1.0.0
     *
     * @param int $index Customer index.
     * @return string Country code, BD for index 9 and US otherwise.
     */
    protected function get_country($index)
    {
        return $index === 9 ? 'BD' : 'US';
    }

    /**
     * Resolve postal code by customer index.
     *
     * @since 1.0.0
     *
     * @param int $index Customer index.
     * @return string Postal code.
     */
    protected function get_postal_code($index)
    {
        $codes = [
            '90210',
            '94043',
            '10118',
            'NW1 6XE',
            'SW1A 2AA',
            '95014',
            '60606',
            '94025',
            '94111',
            '1207',
        ];

        return $codes[$index % count($codes)];
    }
}
