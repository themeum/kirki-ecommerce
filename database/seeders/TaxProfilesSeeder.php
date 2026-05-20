<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\TaxProfile;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Seeder;
use Faker\Generator;

use function Kirki\Ecommerce\collection;
use function Kirki\Ecommerce\faker;

class TaxProfilesSeeder extends Seeder
{
    public function run(): void
    {
        $faker = faker();
        $data = $this->make_tax_profiles_data($faker);

        TaxProfile::query()->insert($data);
    }

    protected function make_tax_profiles_data(Generator $faker)
    {
        $number_of_profiles = 5;

        return collection()
            ->range(1, $number_of_profiles)
            ->map(fn() => ['name' => $faker->words(3, true)])
            ->all();
    }
}
