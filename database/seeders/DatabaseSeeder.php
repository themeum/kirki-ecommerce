<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\Framework\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SettingsSeeder::class,
            ShippingBoxesSeeder::class,
            ShippingProfilesSeeder::class,
            TaxProfilesSeeder::class,
            CurrencySeeder::class,
            CategorySeeder::class,
            TagSeeder::class,
            AttributeSeeder::class,
            BrandSeeder::class,
            ProductSeeder::class,
            ProductSchemaSeeder::class,
            CouponSeeder::class,
            CustomerSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
