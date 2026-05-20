<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ShippingProfile;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Seeder;
use Faker\Generator;

use function Kirki\Ecommerce\collection;
use function Kirki\Ecommerce\faker;

class ShippingProfilesSeeder extends Seeder
{
    public function run(): void
    {
        $faker = faker();
        $data = $this->make_shipping_profiles_data($faker);

        ShippingProfile::query()->insert($data);
    }

    protected function make_shipping_profiles_data(Generator $faker)
    {
        $number_of_profiles = 5;

        return collection()
            ->range(1, $number_of_profiles)
            ->map(fn() => ['name' => $faker->words(3, true)])->all();
    }
}
