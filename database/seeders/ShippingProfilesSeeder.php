<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\Framework\Database\Seeder;

/**
 * Seeds the demo shipping profiles.
 *
 * @since 1.0.0
 */
class ShippingProfilesSeeder extends Seeder
{
    /**
     * Seed shipping profiles for product assignment.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        ShippingProfile::query()->insert($this->get_shipping_profiles());
    }

    /**
     * Curated shipping profile definitions.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>> Profile rows with name and default flag.
     */
    protected function get_shipping_profiles()
    {
        return [
            ['name' => 'Standard Shipping', 'is_default' => true],
            ['name' => 'Express Delivery', 'is_default' => false],
            ['name' => 'Fragile Items', 'is_default' => false],
            ['name' => 'Heavy & Oversized', 'is_default' => false],
            ['name' => 'Free Shipping Eligible', 'is_default' => false],
        ];
    }
}
