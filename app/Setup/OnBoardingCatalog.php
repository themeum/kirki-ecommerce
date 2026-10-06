<?php

namespace Kirki\Ecommerce\App\Setup;

defined('ABSPATH') || exit;

/**
 * Static catalog of the demo products, the attributes they use and the starter coupon, loaded as sample data.
 *
 * @since 1.0.0
 */
class OnBoardingCatalog
{
    /**
     * The attributes and values the demo products are built from.
     *
     * Sample data loading creates any of these the store does not have. Colors
     * carry the same hex codes as the Color attribute preset.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>> Attribute definitions with name, slug, type and values.
     */
    public static function get_demo_attributes()
    {
        return [
            [
                'name' => 'Color',
                'slug' => 'color',
                'type' => 'color',
                'values' => [
                    ['value' => 'Red', 'color' => '#FF0000'],
                    ['value' => 'Green', 'color' => '#008000'],
                    ['value' => 'Blue', 'color' => '#0000FF'],
                    ['value' => 'Orange', 'color' => '#FFA500'],
                ],
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
     * Starter products.
     *
     * Attribute values are resolved by name against the seeded attributes, and
     * media by filename against the images bundled in assets/images/products.
     * Prices are in minor units.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>> Product definitions with copy, media, attributes and variants.
     */
    public static function get_products()
    {
        return [
            [
                'title' => 'Sample product',
                'short_description' => 'A bold, hand-painted ceramic vase featuring playful abstract facial motifs in a vibrant palette of pink, coral, navy, yellow, and purple. A statement art piece for any shelf or tabletop.',
                'description' => 'Bring a burst of creative energy into your space with this striking Abstract Face Ceramic Vase. Inspired by contemporary pop art and abstract expressionism, this piece features a whimsical composition of eyes, curves, and geometric shapes hand-painted in a rich, saturated palette. The rounded silhouette and matte finish give it a tactile, sculptural quality that works equally well as a standalone art object or a bold vessel for dried florals. Each vase is crafted from high-quality ceramic and finished with care, making it a unique addition to modern living rooms, studios, or creative workspaces. Dimensions: approx. 8" H × 5" W.',
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
                'title' => 'Sample product with variants',
                'short_description' => 'A sturdy canvas tote featuring an all-over illustration of whimsical cats in warm tones of red, orange, gold, and cream. Finished with bold red handles for easy carrying.',
                'description' => 'Meet your new everyday carry — the Cat Crowd Canvas Tote Bag. This charming bag is covered in a dense, hand-drawn illustration of dozens of unique cat characters, each with its own personality and expression. Rendered in a warm palette of red, burnt orange, mustard, and cream on natural cotton canvas, the design has a playful, folk-art quality that\'s sure to spark joy (and conversations). The reinforced red cotton handles provide comfortable over-the-shoulder carry, while the roomy interior fits groceries, books, laptops, or weekend market finds with ease. Durable, machine-washable, and endlessly cheerful — perfect for cat lovers and illustration enthusiasts alike. Dimensions: approx. 15" × 16" with 10" handle drop.',
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
                'title' => 'Sample product with multiple variants',
                'short_description' => 'A charming stoneware cup featuring delicate hand-painted botanicals — soft pink blooms, green foliage, and blue buds — layered over bands of warm yellow, sky blue, and sandy terracotta.',
                'description' => 'Sip your morning tea or coffee from something truly special. The Botanical Garden Handpainted Ceramic Cup is a one-of-a-kind piece crafted from natural stoneware and finished with a soft matte glaze. Each cup is individually decorated by hand with a garden scene of stylized flowers, leaves, and seed pods in gentle pinks, greens, and blues, set against layered horizontal bands of buttercup yellow and cornflower blue. The glazed interior provides a smooth drinking surface, while the unglazed sandy base gives it an earthy, artisan feel. Perfectly sized for espresso, matcha, or a small pour of your favorite brew. Food-safe, microwave-friendly, and crafted to become a daily ritual favorite. Capacity: approx. 8 oz. Dimensions: 3.5" H × 3.5" W.',
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

    /**
     * Starter coupons.
     *
     * Sample data loading creates each coupon whose code is not taken yet, and
     * creates it inactive, so the merchant decides when it goes live.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>> Coupon definitions with the stored coupon fields.
     */
    public static function get_coupons()
    {
        return [
            [
                'method' => 'code',
                'title' => 'Welcome 50% off',
                'code' => 'WELCOME50',
                'discount_type' => 'amount-off',
                'discount_target' => 'order',
                'discount_value_type' => 'percentage',
                'discount_amount_percentage' => 50,
                'eligible_item_type' => 'all-products',
                'has_end_datetime' => false,
                'target_country_type' => 'all-countries',
                'first_time_buyer_only' => false,
                'customer_include_eligibility' => 'everyone',
                'customer_exclude_eligibility' => 'none',
                'has_usage_limit' => false,
                'has_customer_limit' => false,
                'combinations' => [],
            ],
        ];
    }
}
