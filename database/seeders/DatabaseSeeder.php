<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\Framework\Database\Seeder;

/**
 * Root seeder that runs every demo-data seeder in dependency order.
 *
 * @since 1.0.0
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Queue all seeders for execution.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        $this->call([
            SettingsSeeder::class,
            CollectionSeeder::class,
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
            CartSeeder::class,
            OrderSeeder::class,
            RefundSeeder::class,
        ]);
    }
}
