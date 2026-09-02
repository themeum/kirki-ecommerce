<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

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
                    ['value' => 'Blush', 'color' => '#E3A9A0'],
                    ['value' => 'Terracotta', 'color' => '#B5603D'],
                    ['value' => 'Mustard', 'color' => '#D8B45C'],
                    ['value' => 'Forest', 'color' => '#4F6B4F'],
                    ['value' => 'Sky', 'color' => '#7FA8C9'],
                    ['value' => 'Teal', 'color' => '#2F6F6B'],
                    ['value' => 'Sand', 'color' => '#D9C4A0'],
                    ['value' => 'Plum', 'color' => '#6B3F52'],
                ]
            ],
            [
                'id' => 2,
                'name' => 'Size',
                'slug' => 'size',
                'type' => 'list',
                'values' => [
                    ['value' => 'XS'],
                    ['value' => 'S'],
                    ['value' => 'M'],
                    ['value' => 'L'],
                    ['value' => 'XL'],
                    ['value' => 'XXL'],
                ]
            ],
            [
                'id' => 3,
                'name' => 'Shoe Size',
                'slug' => 'shoe-size',
                'type' => 'list',
                'values' => [
                    ['value' => '7'],
                    ['value' => '8'],
                    ['value' => '9'],
                    ['value' => '10'],
                    ['value' => '11'],
                    ['value' => '12'],
                ]
            ],
            [
                'id' => 4,
                'name' => 'Material',
                'slug' => 'material',
                'type' => 'list',
                'values' => [
                    ['value' => 'Cotton'],
                    ['value' => 'Denim'],
                    ['value' => 'Leather'],
                    ['value' => 'Polyester'],
                    ['value' => 'Wool'],
                    ['value' => 'Linen'],
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
