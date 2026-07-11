<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\Database\Seeder;

class ProductSchemaSeeder extends Seeder
{
    /**
     * Seed product schema templates for import mapping.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        ProductSchema::query()->insert($this->get_schema_templates());
    }

    /**
     * Curated product schema template definitions.
     *
     * @return array
     * @since 1.0.0
     */
    protected function get_schema_templates()
    {
        $iphone = SeedCatalog::get_products()[0];
        $brand_name = SeedCatalog::get_brand_name($iphone['brand_id']);

        $electronics_schema = [
            'id' => 'schema-electronics-001',
            'sku' => 'APPLE-IPHONE15PRO-RED-SM',
            'ean' => '0194252710012',
            'upc' => '194252710012',
            'name' => $iphone['title'],
            'slug' => 'apple-iphone-15-pro',
            'brand' => $brand_name,
            'price' => [
                'base_price' => $iphone['price'] / 100,
                'sale_price' => $iphone['sale_price'] / 100,
                'discount_type' => 'percentage',
                'currency' => 'USD',
                'tax_class' => 'Standard',
            ],
            'content' => [
                'short_description' => 'Flagship smartphone with titanium design and A17 Pro chip.',
                'long_description' => 'The Apple iPhone 15 Pro features a 6.1-inch Super Retina XDR display, advanced camera system, and all-day battery life.',
                'meta_title' => 'Apple iPhone 15 Pro | Kirki Ecommerce',
                'meta_keywords' => 'smartphone,apple,iphone,premium,bestseller',
                'meta_description' => 'Shop the Apple iPhone 15 Pro with fast shipping and easy returns.',
            ],
            'inventory' => [
                'stock_status' => 'instock',
                'stock_quantity' => 50,
                'low_stock_amount' => 5,
                'weight' => '0.5kg',
                'dimensions' => [
                    'length' => 14.7,
                    'width' => 7.1,
                    'height' => 0.8,
                    'unit' => 'cm',
                ],
            ],
            'media' => [
                'thumbnail' => 'https://placehold.co/200x200?text=iPhone+15+Pro',
                'gallery' => [
                    'https://placehold.co/800x600?text=Front',
                    'https://placehold.co/800x600?text=Back',
                    'https://placehold.co/800x600?text=Side',
                ],
                'video_url' => null,
            ],
            'specifications' => [
                'color' => 'Natural Titanium',
                'material' => 'Titanium',
                'tags' => ['smartphone', 'premium', 'bestseller'],
            ],
            'reviews' => [
                'average_rating' => 4.8,
                'review_count' => 1240,
                'top_review' => [
                    'user' => 'Sarah Johnson',
                    'comment' => 'Excellent phone with an amazing camera. Battery lasts all day.',
                    'rating' => 5,
                ],
            ],
            'status' => 'published',
            'created_at' => '2025-01-15T10:00:00+00:00',
            'updated_at' => '2025-06-01T10:00:00+00:00',
        ];

        $fashion_schema = [
            'id' => 'schema-fashion-001',
            'sku' => 'NIKE-AIR-MAX-90-RED-SM',
            'ean' => '0194252710029',
            'upc' => '194252710029',
            'name' => 'Nike Air Max 90',
            'slug' => 'nike-air-max-90',
            'brand' => 'Nike',
            'price' => [
                'base_price' => 130.00,
                'sale_price' => 110.00,
                'discount_type' => 'percentage',
                'currency' => 'USD',
                'tax_class' => 'Standard',
            ],
            'content' => [
                'short_description' => 'Classic Nike Air Max 90 with visible Air cushioning.',
                'long_description' => 'The Nike Air Max 90 stays true to its roots with iconic Waffle outsole and padded collar for all-day comfort.',
                'meta_title' => 'Nike Air Max 90 | Kirki Ecommerce',
                'meta_keywords' => 'footwear,nike,sneakers,bestseller',
                'meta_description' => 'Shop Nike Air Max 90 sneakers with free returns on footwear.',
            ],
            'inventory' => [
                'stock_status' => 'instock',
                'stock_quantity' => 120,
                'low_stock_amount' => 10,
                'weight' => '0.3kg',
                'dimensions' => [
                    'length' => 32.0,
                    'width' => 20.0,
                    'height' => 12.0,
                    'unit' => 'cm',
                ],
            ],
            'media' => [
                'thumbnail' => 'https://placehold.co/200x200?text=Air+Max+90',
                'gallery' => [
                    'https://placehold.co/800x600?text=Side',
                    'https://placehold.co/800x600?text=Top',
                ],
                'video_url' => null,
            ],
            'specifications' => [
                'color' => 'White/Red',
                'material' => 'Leather and Synthetic',
                'tags' => ['footwear', 'bestseller', 'apparel'],
            ],
            'reviews' => [
                'average_rating' => 4.6,
                'review_count' => 890,
                'top_review' => [
                    'user' => 'Michael Chen',
                    'comment' => 'Comfortable and stylish. True to size.',
                    'rating' => 5,
                ],
            ],
            'status' => 'published',
            'created_at' => '2025-02-01T10:00:00+00:00',
            'updated_at' => '2025-06-01T10:00:00+00:00',
        ];

        return [
            [
                'name' => 'Default Product Schema',
                'is_default' => true,
                'schema' => json_encode($electronics_schema),
            ],
            [
                'name' => 'Electronics Import',
                'is_default' => false,
                'schema' => json_encode($electronics_schema),
            ],
            [
                'name' => 'Fashion Apparel Import',
                'is_default' => false,
                'schema' => json_encode($fashion_schema),
            ],
            [
                'name' => 'Kitchen Appliances Import',
                'is_default' => false,
                'schema' => json_encode(array_merge($electronics_schema, [
                    'name' => 'KitchenAid Artisan Stand Mixer',
                    'slug' => 'kitchenaid-artisan-stand-mixer',
                    'brand' => 'KitchenAid',
                    'specifications' => [
                        'color' => 'Empire Red',
                        'material' => 'Metal',
                        'tags' => ['kitchen-appliance', 'bestseller'],
                    ],
                ])),
            ],
            [
                'name' => 'Beauty & Health Import',
                'is_default' => false,
                'schema' => json_encode(array_merge($electronics_schema, [
                    'name' => 'CeraVe Moisturizing Cream',
                    'slug' => 'cerave-moisturizing-cream',
                    'brand' => 'CeraVe',
                    'specifications' => [
                        'color' => 'White',
                        'material' => 'Cream',
                        'tags' => ['skincare', 'bestseller'],
                    ],
                ])),
            ],
        ];
    }
}
