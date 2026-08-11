<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\Framework\Database\Seeder;

class ShippingProfilesSeeder extends Seeder
{
    /**
     * Seed shipping profiles for product assignment.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        ShippingProfile::query()->insert($this->get_shipping_profiles());
    }

    /**
     * Curated shipping profile definitions.
     *
     * @return array
     * @since 1.0.0
     */
    protected function get_shipping_profiles()
    {
        return [
            ['name' => 'Standard Shipping'],
            ['name' => 'Express Delivery'],
            ['name' => 'Fragile Items'],
            ['name' => 'Heavy & Oversized'],
            ['name' => 'Free Shipping Eligible'],
        ];
    }
}
