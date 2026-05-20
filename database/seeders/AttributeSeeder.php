<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Facades\Log;

class AttributeSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'id' => 1,
                'name' => 'Color',
                'slug' => 'color',
                'type' => 'color',
                'values' => [
                    ['value' => 'Red', 'color' => '#FF0000'],
                    ['value' => 'Green', 'color' => '#00FF00'],
                    ['value' => 'Blue', 'color' => '#0000FF'],
                ]
            ],
            [
                'id' => 2,
                'name' => 'Size',
                'slug' => 'size',
                'type' => 'list',
                'values' => [
                    ['value' => 'Small'],
                    ['value' => 'Medium'],
                    ['value' => 'Large'],
                ]
            ],
            [
                'id' => 3,
                'name' => 'Material',
                'slug' => 'material',
                'type' => 'list',
                'values' => [
                    ['value' => 'Cotton'],
                    ['value' => 'Polyester'],
                    ['value' => 'Silk'],
                ]
            ],
        ];

        foreach ($data as $item) {
            $values = $item['values'];
            unset($item['values']);

            $attribute = Attribute::create($item);
            $attribute->values()->create_many($values);
        }

        Log::info('AttributeSeeder run successfully');
    }
}
