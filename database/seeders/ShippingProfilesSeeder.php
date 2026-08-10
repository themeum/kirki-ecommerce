<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\Framework\Database\Seeder;

use function Kirki\Ecommerce\Framework\collection;

class ShippingProfilesSeeder extends Seeder
{
    /**
     * Seed shipping profiles for product assignment.
     *
     * Runs on every activation, so profiles already present by name are left
     * alone rather than inserted again.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        $existing_names = ShippingProfile::query()->pluck('name')->all();

        $missing = collection($this->get_shipping_profiles())
            ->reject(fn($profile) => in_array($profile['name'], $existing_names, true))
            ->all();

        ShippingProfile::query()->insert(array_values($missing));
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
