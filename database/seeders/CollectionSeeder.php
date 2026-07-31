<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Collection;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

class CollectionSeeder extends Seeder
{
    /**
     * Seed curated collection records.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        $collections = [
            [
                'id' => 1,
                'title' => 'Electronics',
                'slug' => 'electronics',
                'description' => 'Latest gadgets, smartphones, laptops, and audio gear.',
                'seo_title' => 'Shop Electronics | Kirki Ecommerce',
                'seo_description' => 'Discover high quality consumer electronics and tech accessories.',
                'is_active' => true,
                'ordering' => 1,
            ],
            [
                'id' => 2,
                'title' => 'Fashion',
                'slug' => 'fashion',
                'description' => 'Trendy apparel, footwear, and activewear for men and women.',
                'seo_title' => 'Shop Fashion & Apparel | Kirki Ecommerce',
                'seo_description' => 'Explore popular fashion collections from top brands.',
                'is_active' => true,
                'ordering' => 2,
            ],
            [
                'id' => 3,
                'title' => 'Kitchen & Dining',
                'slug' => 'kitchen-dining',
                'description' => 'Essential kitchen appliances, cookware, and dining gadgets.',
                'seo_title' => 'Shop Kitchen & Dining | Kirki Ecommerce',
                'seo_description' => 'Upgrade your cooking with premium kitchen electronics and tools.',
                'is_active' => true,
                'ordering' => 3,
            ],
            [
                'id' => 4,
                'title' => 'Home & Furniture',
                'slug' => 'home-furniture',
                'description' => 'Modern furniture, mattresses, and stylish home decor.',
                'seo_title' => 'Shop Home & Furniture | Kirki Ecommerce',
                'seo_description' => 'Furnish your living space with affordable, quality designs.',
                'is_active' => true,
                'ordering' => 4,
            ],
            [
                'id' => 5,
                'title' => 'Beauty & Health',
                'slug' => 'beauty-health',
                'description' => 'Clinical skincare, personal care, and oral hygiene products.',
                'seo_title' => 'Shop Beauty & Health | Kirki Ecommerce',
                'seo_description' => 'Dermatologist tested skincare and personal care supplies.',
                'is_active' => true,
                'ordering' => 5,
            ],
        ];

        Collection::query()->insert($collections);

        Log::info('CollectionSeeder run successfully');
    }
}
