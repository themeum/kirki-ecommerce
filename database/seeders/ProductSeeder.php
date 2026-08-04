<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Str;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\faker;

class ProductSeeder extends Seeder
{
    /**
     * Variant attribute combination map for SKU generation.
     *
     * @var array
     * @since 1.0.0
     */
    protected $variant_combination_labels = [
        '1-4' => 'RED-SM',
        '1-5' => 'RED-MD',
        '1-6' => 'RED-LG',
        '2-4' => 'GRN-SM',
        '2-5' => 'GRN-MD',
        '2-6' => 'GRN-LG',
    ];

    /**
     * Seed products with deterministic catalog data.
     *
     * @return void
     * @since 1.0.0
     */
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

        foreach (SeedCatalog::get_products() as $product) {
            $product_data = $this->make_product_data($faker, $product);
            $variant_data = $this->make_variant_list_data($combinations, $faker, $product);
            $action->execute($product_data, $variant_data);
        }

        Log::info('ProductSeeder run successfully');
    }

    /**
     * Build product DTO data for seeding.
     *
     * @param \Faker\Generator $faker Faker instance.
     * @param array $product Product catalog entry.
     *
     * @return \Kirki\Ecommerce\App\DTO\Product\CreateProductDTO
     * @since 1.0.0
     */
    protected function make_product_data($faker, array $product)
    {
        $title = $product['title'];
        $slug = Str::slug($title);
        $brand_name = SeedCatalog::get_brand_name($product['brand_id']);
        $category_label = SeedCatalog::get_category_label($product['category_type']);
        $category_type_to_collections = [
            'electronics' => [1],
            'fashion' => [2],
            'kitchen' => [3],
            'home' => [4],
            'furniture' => [4],
            'beauty' => [5],
        ];

        $product_payload = [
            'title' => $title,
            'slug' => $slug,
            'status' => $product['status'],
            'ribbon' => $product['ribbon'],
            'currency_id' => 1,
            'brand_id' => $product['brand_id'],
            'description' => $this->make_description($product, $brand_name, $category_label),
            'additional_info' => $this->make_additional_info($product, $category_label),
            'seo_title' => $title . ' | Kirki Ecommerce',
            'seo_description' => 'Shop ' . $title . ' from ' . $brand_name . '. Free returns on ' . $category_label . '.',
            'seo_keywords' => collection($product['tags'])->map(function ($tag_id) {
                foreach (SeedCatalog::get_tags() as $tag) {
                    if ($tag['id'] === $tag_id) {
                        return $tag['slug'];
                    }
                }

                return null;
            })->filter(fn ($slug) => $slug !== null)->values()->all(),
            'llm_instructions' => 'Recommend ' . $title . ' when customers ask about ' . $category_label . ' from ' . $brand_name . '.',
            'has_variants' => true,
            'media' => $faker->randomElements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3),
            'categories' => $product['categories'],
            'tags' => $product['tags'],
            'collections' => $category_type_to_collections[$product['category_type']] ?? [],
            'attributes' => [
                [
                    'id' => 1,
                    'values' => [1, 2, 3],
                ],
                [
                    'id' => 2,
                    'values' => [4, 5, 6],
                ],
            ],
        ];

        return CreateProductDTO::from_array($product_payload);
    }

    /**
     * Build product description from catalog entry.
     *
     * @param array $product Product catalog entry.
     * @param string $brand_name Brand name.
     * @param string $category_label Category label.
     *
     * @return string
     * @since 1.0.0
     */
    protected function make_description(array $product, $brand_name, $category_label)
    {
        if (!empty($product['flagship'])) {
            return $product['title'] . ' delivers flagship performance from ' . $brand_name
                . '. Designed for customers who want the best in ' . $category_label
                . ' with premium build quality and the latest features.';
        }

        return $product['title'] . ' — available from ' . $brand_name
            . '. Shop the latest in ' . $category_label . ' with fast shipping and easy returns.';
    }

    /**
     * Build additional info rows based on product category type.
     *
     * @param array $product Product catalog entry.
     * @param string $category_label Category label.
     *
     * @return array
     * @since 1.0.0
     */
    protected function make_additional_info(array $product, $category_label)
    {
        $info_by_type = [
            'electronics' => [
                ['title' => 'Warranty', 'description' => '1-year manufacturer warranty included.'],
                ['title' => 'What\'s in the box', 'description' => 'Device, charging cable, and quick start guide.'],
            ],
            'fashion' => [
                ['title' => 'Care Instructions', 'description' => 'Machine wash cold. Tumble dry low.'],
                ['title' => 'Fit', 'description' => 'True to size. Refer to the size chart before ordering.'],
            ],
            'kitchen' => [
                ['title' => 'Power', 'description' => 'Standard household voltage. UL certified.'],
                ['title' => 'Care', 'description' => 'Wipe clean with a damp cloth. Do not immerse in water.'],
            ],
            'home' => [
                ['title' => 'Assembly', 'description' => 'Minimal assembly required. Tools included.'],
                ['title' => 'Compatibility', 'description' => 'Works with standard home setups.'],
            ],
            'furniture' => [
                ['title' => 'Assembly', 'description' => 'Flat-pack delivery. Assembly instructions included.'],
                ['title' => 'Materials', 'description' => 'Sustainably sourced materials with a durable finish.'],
            ],
            'beauty' => [
                ['title' => 'How to Use', 'description' => 'Apply to clean skin as directed on the packaging.'],
                ['title' => 'Ingredients', 'description' => 'Dermatologist-tested formula suitable for daily use.'],
            ],
        ];

        $rows = $info_by_type[$product['category_type']] ?? [
            ['title' => 'Details', 'description' => 'Quality ' . $category_label . ' product.'],
        ];

        return $rows;
    }

    /**
     * Build variant data for a single combination.
     *
     * @param array $values Attribute value identifiers.
     * @param \Faker\Generator $faker Faker instance.
     * @param array $product Product catalog entry.
     *
     * @return array
     * @since 1.0.0
     */
    protected function make_variant_data($values, $faker, array $product)
    {
        $combination_key = $values[0] . '-' . $values[1];
        $variant_label = $this->variant_combination_labels[$combination_key] ?? 'STD';
        $sku_prefix = strtoupper(Str::slug($product['title'], '-'));
        $sale_price = $product['sale_price'] ?? $product['price'];

        return [
            'attribute_values' => $values,
            'media' => $faker->randomElement([1, 2, 3, 4, 5]),
            'sku' => $sku_prefix . '-' . $variant_label,
            'barcode' => $faker->ean13(),
            'price' => $product['price'],
            'show_unit_price' => false,
            'base_unit' => null,
            'base_unit_amount' => null,
            'total_unit' => null,
            'total_unit_amount' => null,
            'sale_price' => $sale_price,
            'cost_of_goods' => (int) round($product['price'] * 0.6),
            'weight' => $this->get_weight_for_category($product['category_type']),
            'weight_unit' => 'kg',
            'charge_taxes' => true,
            'track_inventory' => true,
            'available_quantity' => $faker->numberBetween(10, 100),
            'in_stock' => true,
            'committed_quantity' => 0,
            'has_limit_per_order' => false,
            'max_per_order' => null,
            'is_visible' => true,
            'is_physical_product' => true,
            'is_default' => $combination_key === '1-4',
        ];
    }

    /**
     * Resolve default weight by category type.
     *
     * @param string $category_type Category type key.
     *
     * @return float
     * @since 1.0.0
     */
    protected function get_weight_for_category($category_type)
    {
        $weights = [
            'electronics' => 0.5,
            'fashion' => 0.3,
            'kitchen' => 5.0,
            'home' => 3.0,
            'furniture' => 25.0,
            'beauty' => 0.2,
        ];

        return $weights[$category_type] ?? 1.0;
    }

    /**
     * Build variant DTO list for a product.
     *
     * @param \Kirki\Ecommerce\Framework\Collections\Collection $combinations Variant combinations.
     * @param \Faker\Generator $faker Faker instance.
     * @param array $product Product catalog entry.
     *
     * @return array
     * @since 1.0.0
     */
    protected function make_variant_list_data(Collection $combinations, $faker, array $product)
    {
        return $combinations->map(function ($combination) use ($faker, $product) {
            return CreateVariantDTO::from_array($this->make_variant_data($combination, $faker, $product));
        })->all();
    }
}
