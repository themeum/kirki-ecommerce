<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

class BrandSeeder extends Seeder
{
    /**
     * Seed curated brands matching the product catalog.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        $data = array_map(function ($brand) {
            return [
                'id' => $brand['id'],
                'name' => $brand['name'],
                'slug' => $brand['slug'],
                'description' => $brand['description'],
                'is_active' => true,
            ];
        }, SeedCatalog::get_brands());

        Brand::query()->insert($data);

        Log::info('BrandSeeder run successfully');
    }
}
