<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\Framework\Database\Seeder;

class TaxProfilesSeeder extends Seeder
{
    /**
     * Seed tax profiles for product assignment.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        TaxProfile::query()->insert($this->get_tax_profiles());
    }

    /**
     * Curated tax profile definitions.
     *
     * @return array
     * @since 1.0.0
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
