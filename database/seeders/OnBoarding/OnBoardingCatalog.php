<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

class OnBoardingCatalog
{
    /**
     * The three level category tree offered as the starting catalog structure.
     *
     * Only top level entries carry a description - the picker shows descriptions
     * at that level only, and inventing copy for 240 leaf categories would add
     * noise without adding meaning.
     *
     * @return array
     * @since 1.0.0
     */
    public static function get_categories()
    {
        return [
            [
                'name' => 'Fashion & Apparel',
                'description' => 'Clothing, footwear, and accessories for men, women, and kids.',
                'children' => [
                    [
                        'name' => 'Men\'s Clothing',
                        'children' => [
                            ['name' => 'Shirts'],
                            ['name' => 'T-Shirts'],
                            ['name' => 'Jeans'],
                            ['name' => 'Jackets'],
                            ['name' => 'Shoes'],
                            ['name' => 'Accessories'],
                        ],
                    ],
                    [
                        'name' => 'Women\'s Clothing',
                        'children' => [
                            ['name' => 'Dresses'],
                            ['name' => 'Tops'],
                            ['name' => 'Skirts'],
                            ['name' => 'Lingerie'],
                            ['name' => 'Shoes'],
                            ['name' => 'Jewelry'],
                        ],
                    ],
                    [
                        'name' => 'Kids & Baby',
                        'children' => [
                            ['name' => 'Boys Clothing'],
                            ['name' => 'Girls Clothing'],
                            ['name' => 'Baby Essentials'],
                        ],
                    ],
                    [
                        'name' => 'Bags & Accessories',
                        'children' => [
                            ['name' => 'Backpacks'],
                            ['name' => 'Wallets'],
                            ['name' => 'Sunglasses'],
                            ['name' => 'Watches'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Electronics & Gadgets',
                'description' => 'Phones, computers, audio gear, and everyday technology.',
                'children' => [
                    [
                        'name' => 'Smartphones',
                        'children' => [
                            ['name' => 'Android'],
                            ['name' => 'iPhone'],
                            ['name' => 'Accessories'],
                        ],
                    ],
                    [
                        'name' => 'Computers',
                        'children' => [
                            ['name' => 'Laptops'],
                            ['name' => 'Desktops'],
                            ['name' => 'Monitors'],
                            ['name' => 'Keyboards'],
                            ['name' => 'Mice'],
                        ],
                    ],
                    [
                        'name' => 'Audio',
                        'children' => [
                            ['name' => 'Headphones'],
                            ['name' => 'Speakers'],
                            ['name' => 'Earbuds'],
                        ],
                    ],
                    [
                        'name' => 'Wearables',
                        'children' => [
                            ['name' => 'Smartwatches'],
                            ['name' => 'Fitness Bands'],
                        ],
                    ],
                    [
                        'name' => 'Cameras',
                        'children' => [
                            ['name' => 'DSLR'],
                            ['name' => 'Mirrorless'],
                            ['name' => 'Lenses'],
                            ['name' => 'Accessories'],
                        ],
                    ],
                    [
                        'name' => 'Gaming',
                        'children' => [
                            ['name' => 'Consoles'],
                            ['name' => 'Controllers'],
                            ['name' => 'PC Gaming Gear'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Home & Living',
                'description' => 'Furniture, kitchenware, decor, and home essentials.',
                'children' => [
                    [
                        'name' => 'Furniture',
                        'children' => [
                            ['name' => 'Sofas'],
                            ['name' => 'Beds'],
                            ['name' => 'Chairs'],
                            ['name' => 'Tables'],
                            ['name' => 'Wardrobes'],
                        ],
                    ],
                    [
                        'name' => 'Kitchen',
                        'children' => [
                            ['name' => 'Cookware'],
                            ['name' => 'Utensils'],
                            ['name' => 'Appliances'],
                        ],
                    ],
                    [
                        'name' => 'Home Décor',
                        'children' => [
                            ['name' => 'Wall Art'],
                            ['name' => 'Clocks'],
                            ['name' => 'Vases'],
                            ['name' => 'Lighting'],
                        ],
                    ],
                    [
                        'name' => 'Bedding',
                        'children' => [
                            ['name' => 'Sheets'],
                            ['name' => 'Pillows'],
                            ['name' => 'Blankets'],
                            ['name' => 'Mattresses'],
                        ],
                    ],
                    [
                        'name' => 'Cleaning Supplies',
                        'children' => [
                            ['name' => 'Detergents'],
                            ['name' => 'Mops'],
                            ['name' => 'Brushes'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Beauty & Personal Care',
                'description' => 'Makeup, skincare, hair care, fragrance, and hygiene.',
                'children' => [
                    [
                        'name' => 'Makeup',
                        'children' => [
                            ['name' => 'Lipstick'],
                            ['name' => 'Foundation'],
                            ['name' => 'Eye Makeup'],
                        ],
                    ],
                    [
                        'name' => 'Skincare',
                        'children' => [
                            ['name' => 'Moisturizers'],
                            ['name' => 'Serums'],
                            ['name' => 'Face Wash'],
                        ],
                    ],
                    [
                        'name' => 'Hair Care',
                        'children' => [
                            ['name' => 'Shampoo'],
                            ['name' => 'Conditioner'],
                            ['name' => 'Hair Oil'],
                            ['name' => 'Tools'],
                        ],
                    ],
                    [
                        'name' => 'Fragrance',
                        'children' => [
                            ['name' => 'Perfumes'],
                            ['name' => 'Deodorants'],
                        ],
                    ],
                    [
                        'name' => 'Personal Hygiene',
                        'children' => [
                            ['name' => 'Razors'],
                            ['name' => 'Toothpaste'],
                            ['name' => 'Sanitary Products'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Grocery & Food',
                'description' => 'Pantry staples, fresh food, snacks, and beverages.',
                'children' => [
                    [
                        'name' => 'Beverages',
                        'children' => [
                            ['name' => 'Juices'],
                            ['name' => 'Tea'],
                            ['name' => 'Coffee'],
                            ['name' => 'Soft Drinks'],
                        ],
                    ],
                    [
                        'name' => 'Snacks',
                        'children' => [
                            ['name' => 'Chips'],
                            ['name' => 'Nuts'],
                            ['name' => 'Biscuits'],
                        ],
                    ],
                    [
                        'name' => 'Staples',
                        'children' => [
                            ['name' => 'Rice'],
                            ['name' => 'Flour'],
                            ['name' => 'Pulses'],
                            ['name' => 'Spices'],
                        ],
                    ],
                    [
                        'name' => 'Bakery',
                        'children' => [
                            ['name' => 'Bread'],
                            ['name' => 'Cakes'],
                            ['name' => 'Cookies'],
                        ],
                    ],
                    [
                        'name' => 'Dairy',
                        'children' => [
                            ['name' => 'Milk'],
                            ['name' => 'Butter'],
                            ['name' => 'Cheese'],
                            ['name' => 'Yogurt'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Sports & Outdoors',
                'description' => 'Fitness equipment, sportswear, and gear for the outdoors.',
                'children' => [
                    [
                        'name' => 'Fitness Equipment',
                        'children' => [
                            ['name' => 'Dumbbells'],
                            ['name' => 'Treadmills'],
                            ['name' => 'Yoga Mats'],
                        ],
                    ],
                    [
                        'name' => 'Sportswear',
                        'children' => [
                            ['name' => 'Shoes'],
                            ['name' => 'Jerseys'],
                            ['name' => 'Shorts'],
                        ],
                    ],
                    [
                        'name' => 'Outdoor Gear',
                        'children' => [
                            ['name' => 'Tents'],
                            ['name' => 'Backpacks'],
                            ['name' => 'Camping Tools'],
                        ],
                    ],
                    [
                        'name' => 'Cycling',
                        'children' => [
                            ['name' => 'Bikes'],
                            ['name' => 'Helmets'],
                            ['name' => 'Accessories'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Health & Wellness',
                'description' => 'Supplements, medical devices, and everyday health essentials.',
                'children' => [
                    ['name' => 'Vitamins & Supplements', 'children' => []],
                    [
                        'name' => 'Medical Devices',
                        'children' => [
                            ['name' => 'Thermometers'],
                            ['name' => 'BP Monitors'],
                            ['name' => 'Oximeters'],
                        ],
                    ],
                    ['name' => 'Health Drinks & Nutrition', 'children' => []],
                    [
                        'name' => 'First Aid',
                        'children' => [
                            ['name' => 'Bandages'],
                            ['name' => 'Antiseptics'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Automotive',
                'description' => 'Accessories, spare parts, and maintenance for cars and bikes.',
                'children' => [
                    [
                        'name' => 'Car Accessories',
                        'children' => [
                            ['name' => 'Seat Covers'],
                            ['name' => 'Air Fresheners'],
                        ],
                    ],
                    [
                        'name' => 'Motorcycle Accessories',
                        'children' => [
                            ['name' => 'Helmets'],
                            ['name' => 'Gloves'],
                        ],
                    ],
                    [
                        'name' => 'Spare Parts',
                        'children' => [
                            ['name' => 'Filters'],
                            ['name' => 'Batteries'],
                            ['name' => 'Tires'],
                        ],
                    ],
                    [
                        'name' => 'Tools & Maintenance',
                        'children' => [
                            ['name' => 'Oils'],
                            ['name' => 'Cleaners'],
                            ['name' => 'Kits'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Books, Stationery & Art',
                'description' => 'Books, stationery, art materials, and office supplies.',
                'children' => [
                    [
                        'name' => 'Books',
                        'children' => [
                            ['name' => 'Fiction'],
                            ['name' => 'Non-Fiction'],
                            ['name' => 'Academic'],
                            ['name' => 'Comics'],
                        ],
                    ],
                    [
                        'name' => 'Stationery',
                        'children' => [
                            ['name' => 'Notebooks'],
                            ['name' => 'Pens'],
                            ['name' => 'Markers'],
                            ['name' => 'Folders'],
                        ],
                    ],
                    [
                        'name' => 'Art Supplies',
                        'children' => [
                            ['name' => 'Paints'],
                            ['name' => 'Brushes'],
                            ['name' => 'Canvases'],
                        ],
                    ],
                    [
                        'name' => 'Office Supplies',
                        'children' => [
                            ['name' => 'Printers'],
                            ['name' => 'Paper'],
                            ['name' => 'Files'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Baby & Kids',
                'description' => 'Toys, gear, feeding, and clothing for babies and children.',
                'children' => [
                    [
                        'name' => 'Toys',
                        'children' => [
                            ['name' => 'Educational'],
                            ['name' => 'Soft Toys'],
                            ['name' => 'Action Figures'],
                        ],
                    ],
                    [
                        'name' => 'Baby Gear',
                        'children' => [
                            ['name' => 'Strollers'],
                            ['name' => 'Car Seats'],
                        ],
                    ],
                    [
                        'name' => 'Feeding',
                        'children' => [
                            ['name' => 'Bottles'],
                            ['name' => 'High Chairs'],
                            ['name' => 'Formula'],
                        ],
                    ],
                    ['name' => 'Clothing & Footwear', 'children' => []],
                ],
            ],
            [
                'name' => 'Pet Supplies',
                'description' => 'Food, toys, and care essentials for dogs, cats, and fish.',
                'children' => [
                    [
                        'name' => 'Dog',
                        'children' => [
                            ['name' => 'Food'],
                            ['name' => 'Toys'],
                            ['name' => 'Grooming'],
                            ['name' => 'Beds'],
                        ],
                    ],
                    [
                        'name' => 'Cat',
                        'children' => [
                            ['name' => 'Food'],
                            ['name' => 'Litter'],
                            ['name' => 'Toys'],
                        ],
                    ],
                    [
                        'name' => 'Aquarium',
                        'children' => [
                            ['name' => 'Fish Food'],
                            ['name' => 'Tanks'],
                            ['name' => 'Accessories'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Jewelry & Watches',
                'description' => 'Fine and fashion jewelry, plus watches for every style.',
                'children' => [
                    [
                        'name' => 'Fine Jewelry',
                        'children' => [
                            ['name' => 'Gold'],
                            ['name' => 'Silver'],
                            ['name' => 'Diamonds'],
                        ],
                    ],
                    [
                        'name' => 'Fashion Jewelry',
                        'children' => [
                            ['name' => 'Earrings'],
                            ['name' => 'Necklaces'],
                            ['name' => 'Rings'],
                        ],
                    ],
                    [
                        'name' => 'Watches',
                        'children' => [
                            ['name' => 'Men\'s'],
                            ['name' => 'Women\'s'],
                            ['name' => 'Smartwatches'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Industrial & Office',
                'description' => 'Office equipment, safety gear, and professional tools.',
                'children' => [
                    [
                        'name' => 'Office Equipment',
                        'children' => [
                            ['name' => 'Printers'],
                            ['name' => 'Shredders'],
                            ['name' => 'Chairs'],
                        ],
                    ],
                    [
                        'name' => 'Safety',
                        'children' => [
                            ['name' => 'Gloves'],
                            ['name' => 'Helmets'],
                            ['name' => 'Workwear'],
                        ],
                    ],
                    [
                        'name' => 'Tools',
                        'children' => [
                            ['name' => 'Power Tools'],
                            ['name' => 'Measuring Instruments'],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Digital Products',
                'description' => 'Software, eBooks, audio, and downloadable media.',
                'children' => [
                    [
                        'name' => 'Software',
                        'children' => [
                            ['name' => 'Productivity'],
                            ['name' => 'Security'],
                            ['name' => 'Design Tools'],
                        ],
                    ],
                    ['name' => 'eBooks', 'children' => []],
                    ['name' => 'Music & Audio Files', 'children' => []],
                    ['name' => 'Stock Photos / Video', 'children' => []],
                ],
            ],
            [
                'name' => 'Miscellaneous',
                'description' => 'Gifts, seasonal items, and everything in between.',
                'children' => [
                    [
                        'name' => 'Gifts & Occasions',
                        'children' => [
                            ['name' => 'Greeting Cards'],
                            ['name' => 'Gift Boxes'],
                            ['name' => 'Wedding Items'],
                        ],
                    ],
                    [
                        'name' => 'Religious Items',
                        'children' => [
                            ['name' => 'Prayer Mats'],
                            ['name' => 'Incense'],
                            ['name' => 'Candles'],
                        ],
                    ],
                    [
                        'name' => 'Seasonal',
                        'children' => [
                            ['name' => 'Holiday Decor'],
                            ['name' => 'Summer Gear'],
                            ['name' => 'Winter Clothing'],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Colour presets seeded as values of the Color attribute.
     *
     * @return array
     * @since 1.0.0
     */
    public static function get_colors()
    {
        return [
            ['value' => 'White', 'color' => '#FFFFFF'],
            ['value' => 'Black', 'color' => '#000000'],
            ['value' => 'Gray / Grey', 'color' => '#808080'],
            ['value' => 'Silver', 'color' => '#C0C0C0'],
            ['value' => 'Red', 'color' => '#FF0000'],
            ['value' => 'Blue', 'color' => '#0000FF'],
            ['value' => 'Navy', 'color' => '#000080'],
            ['value' => 'Green', 'color' => '#008000'],
            ['value' => 'Yellow', 'color' => '#FFFF00'],
            ['value' => 'Orange', 'color' => '#FFA500'],
            ['value' => 'Pink', 'color' => '#FFC0CB'],
            ['value' => 'Purple', 'color' => '#800080'],
            ['value' => 'Brown', 'color' => '#A52A2A'],
            ['value' => 'Beige', 'color' => '#F5F5DC'],
            ['value' => 'Gold', 'color' => '#FFD700'],
            ['value' => 'Maroon', 'color' => '#800000'],
            ['value' => 'Teal', 'color' => '#008080'],
            ['value' => 'Cyan / Aqua', 'color' => '#00FFFF'],
            ['value' => 'Magenta', 'color' => '#FF00FF'],
            ['value' => 'Olive', 'color' => '#808000'],
            ['value' => 'Lime', 'color' => '#00FF00'],
            ['value' => 'Coral', 'color' => '#FF7F50'],
            ['value' => 'Turquoise', 'color' => '#40E0D0'],
            ['value' => 'Indigo', 'color' => '#4B0082'],
            ['value' => 'Violet', 'color' => '#EE82EE'],
            ['value' => 'Khaki', 'color' => '#F0E68C'],
            ['value' => 'Tan', 'color' => '#D2B48C'],
            ['value' => 'Crimson', 'color' => '#DC143C'],
            ['value' => 'Royal Blue', 'color' => '#4169E1'],
            ['value' => 'Forest Green', 'color' => '#228B22'],
        ];
    }

    /**
     * Additional attributes required by the starter catalog.
     *
     * @return array
     * @since 1.0.0
     */
    public static function get_attributes()
    {
        return [
            [
                'name' => 'Color',
                'slug' => 'color',
                'type' => 'color',
                'values' => static::get_colors(),
            ],
            [
                'name' => 'Material',
                'slug' => 'material',
                'type' => 'list',
                'values' => [
                    ['value' => 'Ceramic'],
                    ['value' => 'Glass'],
                ],
            ],
        ];
    }

    /**
     * Schema profiles offered out of the box.
     *
     * Restricted to the groups and keys the product form's schema picker can
     * render, so opening and saving a seeded profile never silently drops a
     * field. Product.name and Offer.price are required in every profile.
     *
     * @return array
     * @since 1.0.0
     */
    public static function get_schema_profiles()
    {
        $basic = [
            'Product' => ['name', 'description', 'image'],
            'Offer' => ['price', 'priceCurrency', 'availability'],
        ];

        $with_rating = $basic + ['AggregateRating' => ['ratingValue', 'reviewCount']];
        $with_brand = $basic + ['Brand' => ['name', 'logo']];

        return [
            ['name' => 'Default Product Schema', 'is_default' => true, 'schema' => $basic],
            ['name' => 'Product With Ratings', 'is_default' => false, 'schema' => $with_rating],
            ['name' => 'Branded Product', 'is_default' => false, 'schema' => $with_brand],
            [
                'name' => 'Complete Product Schema',
                'is_default' => false,
                'schema' => $with_rating + ['Brand' => ['name', 'logo']],
            ],
        ];
    }

    /**
     * Starter products.
     *
     * Category paths are resolved by name against the seeded tree, attribute
     * values by name against the seeded attributes, and media by filename
     * against the images bundled in assets/images/products. Prices are in
     * minor units.
     *
     * @return array
     * @since 1.0.0
     */
    public static function get_products()
    {
        return [
            [
                'title' => 'Abstract Face Ceramic Vase',
                'short_description' => 'A bold, hand-painted ceramic vase featuring playful abstract facial motifs in a vibrant palette of pink, coral, navy, yellow, and purple. A statement art piece for any shelf or tabletop.',
                'description' => 'Bring a burst of creative energy into your space with this striking Abstract Face Ceramic Vase. Inspired by contemporary pop art and abstract expressionism, this piece features a whimsical composition of eyes, curves, and geometric shapes hand-painted in a rich, saturated palette. The rounded silhouette and matte finish give it a tactile, sculptural quality that works equally well as a standalone art object or a bold vessel for dried florals. Each vase is crafted from high-quality ceramic and finished with care, making it a unique addition to modern living rooms, studios, or creative workspaces. Dimensions: approx. 8" H × 5" W.',
                'category_path' => ['Home & Living', 'Home Décor', 'Vases'],
                'media' => ['pop-art-vase.webp', 'abstract-eye-vase.webp', 'pink-eye-pot.webp'],
                'attributes' => [],
                'variants' => [
                    [
                        'label' => 'DEFAULT',
                        'attribute_values' => [],
                        'media' => 'pop-art-vase.webp',
                        'base_price' => 8900,
                        'weight' => 1.2,
                        'is_default' => true,
                    ],
                ],
            ],
            [
                'title' => 'Cat Crowd Canvas Tote Bag',
                'short_description' => 'A sturdy canvas tote featuring an all-over illustration of whimsical cats in warm tones of red, orange, gold, and cream. Finished with bold red handles for easy carrying.',
                'description' => 'Meet your new everyday carry — the Cat Crowd Canvas Tote Bag. This charming bag is covered in a dense, hand-drawn illustration of dozens of unique cat characters, each with its own personality and expression. Rendered in a warm palette of red, burnt orange, mustard, and cream on natural cotton canvas, the design has a playful, folk-art quality that\'s sure to spark joy (and conversations). The reinforced red cotton handles provide comfortable over-the-shoulder carry, while the roomy interior fits groceries, books, laptops, or weekend market finds with ease. Durable, machine-washable, and endlessly cheerful — perfect for cat lovers and illustration enthusiasts alike. Dimensions: approx. 15" × 16" with 10" handle drop.',
                'category_path' => ['Fashion & Apparel', 'Bags & Accessories'],
                'media' => ['orange-cat-tote.webp', 'green-cat-tote.webp', 'blue-cat-tote.webp'],
                'attributes' => [
                    'Color' => ['Red', 'Green', 'Blue'],
                ],
                'variants' => [
                    [
                        'label' => 'RED',
                        'attribute_values' => ['Color' => 'Red'],
                        'media' => 'orange-cat-tote.webp',
                        'base_price' => 4000,
                        'weight' => 0.3,
                        'is_default' => true,
                    ],
                    [
                        'label' => 'GRN',
                        'attribute_values' => ['Color' => 'Green'],
                        'media' => 'green-cat-tote.webp',
                        'base_price' => 4500,
                        'weight' => 0.3,
                        'is_default' => false,
                    ],
                    [
                        'label' => 'BLU',
                        'attribute_values' => ['Color' => 'Blue'],
                        'media' => 'blue-cat-tote.webp',
                        'base_price' => 4500,
                        'weight' => 0.3,
                        'is_default' => false,
                    ],
                ],
            ],
            [
                'title' => 'Botanical Garden Handpainted Ceramic Cup',
                'short_description' => 'A charming stoneware cup featuring delicate hand-painted botanicals — soft pink blooms, green foliage, and blue buds — layered over bands of warm yellow, sky blue, and sandy terracotta.',
                'description' => 'Sip your morning tea or coffee from something truly special. The Botanical Garden Handpainted Ceramic Cup is a one-of-a-kind piece crafted from natural stoneware and finished with a soft matte glaze. Each cup is individually decorated by hand with a garden scene of stylized flowers, leaves, and seed pods in gentle pinks, greens, and blues, set against layered horizontal bands of buttercup yellow and cornflower blue. The glazed interior provides a smooth drinking surface, while the unglazed sandy base gives it an earthy, artisan feel. Perfectly sized for espresso, matcha, or a small pour of your favorite brew. Food-safe, microwave-friendly, and crafted to become a daily ritual favorite. Capacity: approx. 8 oz. Dimensions: 3.5" H × 3.5" W.',
                'category_path' => ['Home & Living', 'Kitchen', 'Utensils'],
                'media' => [
                    'orange-floral-cup.webp',
                    'amber-floral-cup.webp',
                    'yellow-floral-cup.webp',
                    'floral-glass-bowl.webp',
                ],
                'attributes' => [
                    'Color' => ['Orange', 'Blue'],
                    'Material' => ['Ceramic', 'Glass'],
                ],
                'variants' => [
                    [
                        'label' => 'ORG-CER',
                        'attribute_values' => ['Color' => 'Orange', 'Material' => 'Ceramic'],
                        'media' => 'orange-floral-cup.webp',
                        'base_price' => 3200,
                        'weight' => 0.4,
                        'is_default' => true,
                    ],
                    [
                        'label' => 'ORG-GLS',
                        'attribute_values' => ['Color' => 'Orange', 'Material' => 'Glass'],
                        'media' => 'amber-floral-cup.webp',
                        'base_price' => 3800,
                        'weight' => 0.35,
                        'is_default' => false,
                    ],
                    [
                        'label' => 'BLU-CER',
                        'attribute_values' => ['Color' => 'Blue', 'Material' => 'Ceramic'],
                        'media' => 'yellow-floral-cup.webp',
                        'base_price' => 3200,
                        'weight' => 0.4,
                        'is_default' => false,
                    ],
                    [
                        'label' => 'BLU-GLS',
                        'attribute_values' => ['Color' => 'Blue', 'Material' => 'Glass'],
                        'media' => 'floral-glass-bowl.webp',
                        'base_price' => 3800,
                        'weight' => 0.35,
                        'is_default' => false,
                    ],
                ],
            ],
        ];
    }
}
