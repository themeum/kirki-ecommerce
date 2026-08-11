<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

class ProductSchemaSeeder extends Seeder
{
    /**
     * Seed the schema profiles a merchant can assign to a product.
     *
     * The schema column is encoded here because the bulk insert bypasses the
     * model's set_schema_attribute mutator.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        if (ProductSchema::query()->exists()) {
            return;
        }

        $profiles = array_map(function ($profile) {
            return [
                'name' => $profile['name'],
                'is_default' => $profile['is_default'],
                'schema' => json_encode($profile['schema']),
            ];
        }, OnBoardingCatalog::get_schema_profiles());

        ProductSchema::query()->insert($profiles);

        Log::info(sprintf('OnBoarding ProductSchemaSeeder created %d schema profiles', count($profiles)));
    }
}
