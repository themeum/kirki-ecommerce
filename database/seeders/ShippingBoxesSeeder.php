<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\ShippingBox;
use Kirki\Ecommerce\Framework\Database\Seeder;

class ShippingBoxesSeeder extends Seeder
{
    /**
     * Seed standard shipping box sizes.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        ShippingBox::query()->insert($this->get_shipping_boxes());
    }

    /**
     * Curated shipping box definitions.
     *
     * @return array
     * @since 1.0.0
     */
    protected function get_shipping_boxes()
    {
        return [
            [
                'name' => 'Small Poly Mailer',
                'description' => 'For apparel, accessories, and small electronics.',
                'width' => 25.00,
                'height' => 30.00,
                'length' => 2.00,
                'unit' => 'cm',
                'is_default' => true,
            ],
            [
                'name' => 'Medium Carton Box',
                'description' => 'Standard box for shoes, kitchen appliances, and medium items.',
                'width' => 40.00,
                'height' => 30.00,
                'length' => 25.00,
                'unit' => 'cm',
                'is_default' => false,
            ],
            [
                'name' => 'Large Carton Box',
                'description' => 'For laptops, vacuum cleaners, and bulky home goods.',
                'width' => 60.00,
                'height' => 40.00,
                'length' => 35.00,
                'unit' => 'cm',
                'is_default' => false,
            ],
            [
                'name' => 'Extra Large Furniture Box',
                'description' => 'For flat-pack furniture, mattresses, and oversized items.',
                'width' => 120.00,
                'height' => 80.00,
                'length' => 20.00,
                'unit' => 'cm',
                'is_default' => false,
            ],
        ];
    }
}
