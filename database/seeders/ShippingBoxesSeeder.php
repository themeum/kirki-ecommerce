<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ShippingBox;
use Kirki\Ecommerce\Framework\Database\Seeder;

/**
 * Seeds the standard shipping box sizes.
 *
 * @since 1.0.0
 */
class ShippingBoxesSeeder extends Seeder
{
    /**
     * Seed standard shipping box sizes.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        ShippingBox::query()->insert($this->get_shipping_boxes());
    }

    /**
     * Curated shipping box definitions.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>> Box rows with name, description, dimensions in cm and default flag.
     */
    protected function get_shipping_boxes()
    {
        return [
            [
                'name' => 'Small Poly Mailer',
                'description' => 'For single apparel items and lightweight accessories.',
                'width' => 25.00,
                'height' => 30.00,
                'length' => 2.00,
                'unit' => 'cm',
                'is_default' => true,
            ],
            [
                'name' => 'Medium Carton Box',
                'description' => 'Standard box for shoes, bags, and folded apparel.',
                'width' => 40.00,
                'height' => 30.00,
                'length' => 25.00,
                'unit' => 'cm',
                'is_default' => false,
            ],
            [
                'name' => 'Large Carton Box',
                'description' => 'For bulky outerwear and multi-item apparel orders.',
                'width' => 60.00,
                'height' => 40.00,
                'length' => 35.00,
                'unit' => 'cm',
                'is_default' => false,
            ],
            [
                'name' => 'Bulk Order Box',
                'description' => 'For wholesale and large multi-item apparel orders.',
                'width' => 120.00,
                'height' => 80.00,
                'length' => 20.00,
                'unit' => 'cm',
                'is_default' => false,
            ],
        ];
    }
}
