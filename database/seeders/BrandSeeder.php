<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Facades\Log;
use Kirki\Ecommerce\Supports\Str;

use function Kirki\Ecommerce\collection;
use function Kirki\Ecommerce\faker;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $data = collection()->range(1, 10)->map(function ($index) {
            $faker = faker();
            $name = $faker->company();

            return [
                'id' => $index,
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => $faker->sentence(10),
                'is_active' => true,
            ];
        });

        Brand::query()->insert($data->all());

        Log::info('BrandSeeder run successfully');
    }
}
