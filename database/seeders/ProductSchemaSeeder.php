<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\Framework\Database\Seeder;

use function Kirki\Ecommerce\Framework\collection;

class ProductSchemaSeeder extends Seeder
{
    /**
     * Seed product schema templates for import mapping.
     *
     * Runs on every activation, so templates already present by name are left
     * alone, and the default flag is only claimed when no default exists.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        $existing_names = ProductSchema::query()->pluck('name')->all();

        $missing = collection($this->get_schema_templates())
            ->reject(fn($template) => in_array($template['name'], $existing_names, true))
            ->all();

        if (empty($missing)) {
            return;
        }

        if (ProductSchema::query()->where('is_default', 1)->exists()) {
            $missing = array_map(function ($template) {
                $template['is_default'] = false;

                return $template;
            }, $missing);
        }

        ProductSchema::query()->insert(array_values($missing));
    }

    /**
     * Curated product schema template definitions.
     *
     * Each template maps a JSON-LD group (Product, Offer, AggregateRating,
     * Brand) to the list of fields included from that group — the same
     * shape produced by the Schema Profile builder in Settings → Essentials.
     *
     * @return array
     * @since 1.0.0
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
