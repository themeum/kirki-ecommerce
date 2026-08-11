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
            ['name' => 'Standard Rate'],
            ['name' => 'Reduced Rate'],
            ['name' => 'Zero Rate'],
            ['name' => 'Digital Goods'],
            ['name' => 'Shipping Tax'],
        ];
    }
}
