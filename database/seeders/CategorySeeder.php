<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Facades\Log;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'id' => 1,
                'name' => 'Electronics',
                'slug' => 'electronics',
                'description' => 'Explore the latest in technology and gadgets.',
                'parent_id' => null,
                'level' => 1,
                'ordering' => 1,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
            [
                'id' => 2,
                'name' => 'Mobile Phones',
                'slug' => 'mobile-phones',
                'description' => 'Latest smartphones from top brands.',
                'parent_id' => 1,
                'level' => 2,
                'ordering' => 1,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
            [
                'id' => 3,
                'name' => 'Laptops',
                'slug' => 'laptops',
                'description' => 'High-performance laptops for work and play.',
                'parent_id' => 1,
                'level' => 2,
                'ordering' => 2,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
            [
                'id' => 4,
                'name' => 'Fashion',
                'slug' => 'fashion',
                'description' => 'Trendy apparel and accessories for everyone.',
                'parent_id' => null,
                'level' => 1,
                'ordering' => 2,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
            [
                'id' => 5,
                'name' => 'Men\'s Fashion',
                'slug' => 'mens-fashion',
                'description' => 'Stylish clothing and footwear for men.',
                'parent_id' => 4,
                'level' => 2,
                'ordering' => 1,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
            [
                'id' => 6,
                'name' => 'Women\'s Fashion',
                'slug' => 'womens-fashion',
                'description' => 'Elegant dresses and accessories for women.',
                'parent_id' => 4,
                'level' => 2,
                'ordering' => 2,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
            [
                'id' => 7,
                'name' => 'Home & Living',
                'slug' => 'home-living',
                'description' => 'Everything you need for a comfortable home.',
                'parent_id' => null,
                'level' => 1,
                'ordering' => 3,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
            [
                'id' => 8,
                'name' => 'Kitchenware',
                'slug' => 'kitchenware',
                'description' => 'Essential tools and appliances for your kitchen.',
                'parent_id' => 7,
                'level' => 2,
                'ordering' => 1,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
            [
                'id' => 9,
                'name' => 'Furniture',
                'slug' => 'furniture',
                'description' => 'Modern furniture for every room in your house.',
                'parent_id' => 7,
                'level' => 2,
                'ordering' => 2,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
            [
                'id' => 10,
                'name' => 'Beauty & Health',
                'slug' => 'beauty-health',
                'description' => 'Personal care products and cosmetics.',
                'parent_id' => null,
                'level' => 1,
                'ordering' => 4,
                'is_active' => true,
                'is_deletable' => true,
                'created_by' => 1,
            ],
        ];

        Category::query()->insert($categories);

        Log::info('CategorySeeder run successfully');
    }
}
