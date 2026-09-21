<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\Framework\Database\Seeder;

/**
 * Seeds the demo product schema templates.
 *
 * @since 1.0.0
 */
class ProductSchemaSeeder extends Seeder
{
    /**
     * Seed product schema templates for import mapping.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        ProductSchema::query()->insert($this->get_schema_templates());
    }

    /**
     * Curated product schema template definitions.
     *
     * Each template maps a JSON-LD group (Product, Offer, AggregateRating,
     * Brand) to the list of fields included from that group — the same
     * shape produced by the Schema Profile builder in Settings → Essentials.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>> Rows with name, is_default and JSON-encoded schema.
     */
    protected function get_schema_templates()
    {
        $product_schema = [
            'Product' => ['name', 'description', 'image'],
            'Offer' => ['price', 'priceCurrency', 'availability'],
        ];

        $product_with_rating_schema = [
            'Product' => ['name', 'description', 'image'],
            'Offer' => ['price', 'priceCurrency', 'availability'],
            'AggregateRating' => ['ratingValue', 'reviewCount'],
        ];

        $product_with_brand_schema = [
            'Product' => ['name', 'description', 'image'],
            'Offer' => ['price', 'priceCurrency', 'availability'],
            'Brand' => ['name', 'logo'],
        ];

        return [
            [
                'name' => 'Default Product Schema',
                'is_default' => true,
                'schema' => json_encode($product_schema),
            ],
            [
                'name' => 'Electronics Import',
                'is_default' => false,
                'schema' => json_encode($product_with_rating_schema),
            ],
            [
                'name' => 'Fashion Apparel Import',
                'is_default' => false,
                'schema' => json_encode($product_with_brand_schema),
            ],
            [
                'name' => 'Kitchen Appliances Import',
                'is_default' => false,
                'schema' => json_encode($product_with_rating_schema),
            ],
            [
                'name' => 'Beauty & Health Import',
                'is_default' => false,
                'schema' => json_encode($product_schema),
            ],
        ];
    }
}
