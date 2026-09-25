<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Str;

/**
 * Seeds the Shopify Standard Product Taxonomy attributes and values for the seeded categories.
 *
 * @since 1.0.0
 */
class AttributeSeeder extends Seeder
{
    /**
     * Create the catalog's attributes and their values.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        foreach (SeedCatalog::get_attributes() as $item) {
            $values = $item['values'];
            unset($item['values']);

            $item['slug'] = Str::slug($item['name']);

            $attribute = Attribute::create($item);
            $attribute->values()->create_many($values);
        }

        Log::info('AttributeSeeder run successfully');
    }
}
