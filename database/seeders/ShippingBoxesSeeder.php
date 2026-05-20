<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ShippingBox;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Seeder;

use Faker\Generator;

use function Kirki\Ecommerce\collection;
use function Kirki\Ecommerce\faker;

class ShippingBoxesSeeder extends Seeder
{
    public function run(): void
    {
        $faker = faker();
        $data = $this->make_shipping_boxes_data($faker);

        ShippingBox::query()->insert($data);
    }

    protected function make_shipping_boxes_data(Generator $faker)
    {
        $number_of_boxes = 4;

        return collection()
            ->range(1, $number_of_boxes)
            ->map(fn($index) => [
                'name' => $faker->words(3, true),
                'description' => $faker->sentence(10),
                'width' => $faker->randomFloat(2, 1, 10),
                'height' => $faker->randomFloat(2, 1, 10),
                'length' => $faker->randomFloat(2, 1, 10),
                'unit' => $faker->randomElement(['cm', 'm', 'in', 'ft']),
                'is_default' => $index === 1,
            ])->all();
    }
}
