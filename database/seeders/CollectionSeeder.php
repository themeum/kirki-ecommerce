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
                'title' => 'New Arrivals',
                'slug' => 'new-arrivals',
                'description' => 'The latest apparel and accessories just landed.',
                'seo_title' => 'New Arrivals | Kirki Ecommerce',
                'seo_description' => 'Shop the newest fashion drops before they sell out.',
                'is_active' => true,
                'ordering' => 1,
            ],
            [
                'id' => 2,
                'title' => 'Best Sellers',
                'slug' => 'best-sellers',
                'description' => 'Customer favorites across apparel and footwear.',
                'seo_title' => 'Best Selling Fashion | Kirki Ecommerce',
                'seo_description' => 'Discover the most popular apparel and accessories.',
                'is_active' => true,
                'ordering' => 2,
            ],
            [
                'id' => 3,
                'title' => 'Men\'s Collection',
                'slug' => 'mens-collection',
                'description' => 'Tops, bottoms, outerwear, and footwear for men.',
                'seo_title' => 'Shop Men\'s Fashion | Kirki Ecommerce',
                'seo_description' => 'Explore men\'s apparel and footwear from top brands.',
                'is_active' => true,
                'ordering' => 3,
            ],
            [
                'id' => 4,
                'title' => 'Women\'s Collection',
                'slug' => 'womens-collection',
                'description' => 'Tops, dresses, bottoms, outerwear, and footwear for women.',
                'seo_title' => 'Shop Women\'s Fashion | Kirki Ecommerce',
                'seo_description' => 'Explore women\'s apparel and footwear from top brands.',
                'is_active' => true,
                'ordering' => 4,
            ],
            [
                'id' => 5,
                'title' => 'Kids\' Collection',
                'slug' => 'kids-collection',
                'description' => 'Everyday apparel for boys and girls.',
                'seo_title' => 'Shop Kids\' Fashion | Kirki Ecommerce',
                'seo_description' => 'Comfortable, durable apparel for kids of all ages.',
                'is_active' => true,
                'ordering' => 5,
            ],
            [
                'id' => 6,
                'title' => 'Accessories',
                'slug' => 'accessories',
                'description' => 'Bags, eyewear, watches, and hats to complete any outfit.',
                'seo_title' => 'Shop Accessories | Kirki Ecommerce',
                'seo_description' => 'Finish your look with premium bags, eyewear, and jewelry.',
                'is_active' => true,
                'ordering' => 6,
            ],
            [
                'id' => 7,
                'title' => 'Sale',
                'slug' => 'sale',
                'description' => 'Discounted apparel, footwear, and accessories.',
                'seo_title' => 'Fashion Sale | Kirki Ecommerce',
                'seo_description' => 'Save on apparel, footwear, and accessories while supplies last.',
                'is_active' => true,
                'ordering' => 7,
            ],
        ];

        Collection::query()->insert($collections);

        Log::info('CollectionSeeder run successfully');
    }
}
