<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\Supports\Facades\Log;
use Kirki\Ecommerce\Supports\Str;

use function Kirki\Ecommerce\app;
use function Kirki\Ecommerce\collection;
use function Kirki\Ecommerce\faker;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $faker = faker();
        $combinations = collection([
            [1, 4],
            [1, 5],
            [1, 6],
            [2, 4],
            [2, 5],
            [2, 6],
        ]);

        $action = app()->make(CreateProductAction::class);

        for ($i = 0; $i < 10; $i++) {
            $product_data = $this->make_product_data($faker);
            $variant_data = $this->make_variant_list_data($combinations, $faker);
            $action->execute($product_data, $variant_data);
        }

        Log::info('ProductSeeder run successfully');
    }

    protected function make_product_data($faker)
    {
        $title = $faker->name();
        $slug = Str::slug($title);

        $has_limit_per_order = $faker->boolean();
        $has_variants = $faker->boolean();

        $product = [
            'title' => $title,
            'slug' => $slug,
            'status' => $faker->randomElement(['draft', 'published', 'unpublished', 'archived']),
            'ribbon' => $faker->words(2, true),
            'currency_id' => $faker->randomElement([1, 2, 3]),
            'brand_id' => $faker->randomElement([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
            'description' => $faker->sentence(15),
            'additional_info' => [
                [
                    'title' => 'foo',
                    'description' => 'bar'
                ]
            ],
            'allow_back_order' => $faker->boolean(),
            'has_limit_per_order' => $has_limit_per_order,
            'max_per_order' => $has_limit_per_order ? $faker->numberBetween(1, 100) : null,
            'seo_title' => $faker->sentence(10),
            'seo_description' => $faker->sentence(10),
            'seo_keywords' => collection()->range(1, 5)->map(fn() => $faker->word())->all(),
            'llm_instructions' => $faker->sentence(10),
            'has_variants' => $has_variants,
            'media' => $faker->randomElements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3),
            'categories' => $faker->randomElements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3),
            'tags' => $faker->randomElements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5),
            'attributes' => [
                [
                    "id" => 1,
                    "values" => $faker->randomElements([1, 2, 3], 2)
                ],
                [
                    "id" => 2,
                    "values" => $faker->randomElements([4, 5, 6], 2)
                ]
            ],
            'created_by' => 1,
        ];

        return CreateProductDTO::from_array($product);
    }

    protected function make_variant_data($values, $faker)
    {
        return [
            "attribute_values" => $values,
            'media' => $faker->randomElement([1, 2, 3, 4, 5]),
            'sku' => $faker->uuid(),
            'barcode' => $faker->ean13(),
            'price' => $faker->numberBetween(1000, 100000),
            'show_unit_price' => $faker->boolean(),
            'base_unit' => $faker->randomElement([1, 2, 3]),
            'base_unit_amount' => $faker->numberBetween(1000, 10000),
            'total_unit' => $faker->numberBetween(1, 10),
            'total_unit_amount' => $faker->numberBetween(1000, 10000),
            'sale_price' => $faker->numberBetween(1000, 100000),
            'cost_of_goods' => $faker->numberBetween(1000, 100000),
            'weight' => $faker->numberBetween(1, 10),
            'weight_unit' => $faker->randomElement(['kg', 'g', 'lb', 'oz']),
            'charge_taxes' => $faker->boolean(),
            'allow_back_order' => $faker->boolean(),
            'track_inventory' => $faker->boolean(),
            'available_quantity' => $faker->numberBetween(1, 100),
            'in_stock' => true,
            'committed_quantity' => 0,
            'has_limit_per_order' => $faker->boolean(),
            'max_per_order' => $faker->numberBetween(10, 50),
            'is_visible' => true,
            'is_physical_product' => true,
            'is_default' => $faker->boolean(),
        ];
    }

    protected function make_variant_list_data(Collection $combinations, $faker)
    {
        return $combinations->map(function ($combination) use ($faker) {
            return CreateVariantDTO::from_array($this->make_variant_data($combination, $faker));
        })->all();
    }
}
