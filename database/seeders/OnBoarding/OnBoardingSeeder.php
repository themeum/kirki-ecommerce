<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

use Kirki\Ecommerce\Framework\Database\Seeder;

class OnBoardingSeeder extends Seeder
{
    /**
     * Queue the seeders that give a newly installed store a usable starting point.
     *
     * Ordered by dependency: products resolve their currency, categories and
     * attribute values from what the earlier seeders created. Each child guards
     * its own target, so this is safe to reach more than once.
     *
     * This queues only - the caller invokes the seeder to drain the queue.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        $this->call([
            CurrencySeeder::class,
            CategorySeeder::class,
            AttributeSeeder::class,
            ProductSchemaSeeder::class,
            SettingsSeeder::class,
            ProductSeeder::class,
        ]);
    }
}
