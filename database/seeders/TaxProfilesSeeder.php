<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\Framework\Database\Seeder;

use function Kirki\Ecommerce\Framework\collection;

class TaxProfilesSeeder extends Seeder
{
    /**
     * Seed tax profiles for product assignment.
     *
     * Runs on every activation, so profiles already present by name are left
     * alone rather than inserted again.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        $existing_names = TaxProfile::query()->pluck('name')->all();

        $missing = collection($this->get_tax_profiles())
            ->reject(fn($profile) => in_array($profile['name'], $existing_names, true))
            ->all();

        TaxProfile::query()->insert(array_values($missing));
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
