<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\Framework\Database\Seeder;

/**
 * Seeds the demo tax profiles.
 *
 * @since 1.0.0
 */
class TaxProfilesSeeder extends Seeder
{
    /**
     * Seed tax profiles for product assignment.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        TaxProfile::query()->insert($this->get_tax_profiles());
    }

    /**
     * Curated tax profile definitions.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>> Profile rows with name and default flag.
     */
    protected function get_tax_profiles()
    {
        return [
            ['name' => 'Standard Rate', 'is_default' => true],
            ['name' => 'Reduced Rate', 'is_default' => false],
            ['name' => 'Zero Rate', 'is_default' => false],
            ['name' => 'Digital Goods', 'is_default' => false],
            ['name' => 'Shipping Tax', 'is_default' => false],
        ];
    }
}
