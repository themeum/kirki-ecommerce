<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Seeder;
use Faker\Generator;

use function Kirki\Ecommerce\collection;
use function Kirki\Ecommerce\faker;

class ProductSchemaSeeder extends Seeder
{
    public function run(): void
    {
        $faker = faker();
        $data = $this->make_product_schema_data($faker);

        ProductSchema::query()->insert($data);
    }

    protected function make_product_schema_data(Generator $faker)
    {
        $number_of_schemas = 5;

        $product = [
            'id'                => $faker->uuid(),
            'sku'               => strtoupper($faker->bothify('??-####-???')),
            'ean'               => $faker->ean13(),
            'upc'               => $faker->numerify('############'),
            'name'              => ucwords($faker->words(4, true)),
            'slug'              => $faker->slug(),
            'brand'             => $faker->company(),

            'price' => [
                'base_price'    => $faker->randomFloat(2, 50, 500),
                'sale_price'    => $faker->randomFloat(2, 10, 49),
                'discount_type' => 'percentage',
                'currency'      => $faker->currencyCode(),
                'tax_class'     => $faker->randomElement(['Standard', 'Reduced', 'Exempt']),
            ],

            'content' => [
                'short_description' => $faker->sentence(),
                'long_description'  => $faker->paragraphs(3, true),
                'meta_title'        => $faker->text(60),
                'meta_keywords'     => implode(',', $faker->words(5)),
                'meta_description'  => $faker->text(160),
            ],

            'inventory' => [
                'stock_status'      => $faker->randomElement(['instock', 'outofstock', 'onbackorder']),
                'stock_quantity'    => $faker->numberBetween(0, 1000),
                'low_stock_amount'  => 5,
                'weight'            => $faker->randomFloat(2, 0.1, 50) . 'kg',
                'dimensions' => [
                    'length' => $faker->randomFloat(1, 1, 100),
                    'width'  => $faker->randomFloat(1, 1, 100),
                    'height' => $faker->randomFloat(1, 1, 100),
                    'unit'   => 'cm'
                ],
            ],

            'media' => [
                'thumbnail' => $faker->imageUrl(200, 200, 'technics'),
                'gallery'   => [
                    $faker->imageUrl(800, 600, 'abstract'),
                    $faker->imageUrl(800, 600, 'city'),
                    $faker->imageUrl(800, 600, 'transport')
                ],
                'video_url' => 'https://youtube.com' . $faker->regexify('[A-Za-z0-9]{11}'),
            ],

            'specifications' => [
                'color'    => $faker->safeColorName(),
                'material' => $faker->randomElement(['Carbon Fiber', 'Aluminum', 'Synthetic']),
                'tags'     => $faker->words(5),
            ],

            'reviews' => [
                'average_rating' => $faker->randomFloat(1, 1, 5),
                'review_count'   => $faker->numberBetween(0, 5000),
                'top_review'     => [
                    'user'    => $faker->name(),
                    'comment' => $faker->realText(100),
                    'rating'  => $faker->numberBetween(4, 5)
                ]
            ],

            'status'     => $faker->randomElement(['draft', 'published', 'archived']),
            'created_at' => $faker->dateTimeThisYear()->format('c'),
            'updated_at' => $faker->dateTimeThisMonth()->format('c'),
        ];

        return collection()
            ->range(1, $number_of_schemas)
            ->map(fn($index) => [
                'name' => $faker->words(3, true),
                'is_default' => $index === 1,
                'schema' => json_encode($product)
            ])->all();
    }
}
