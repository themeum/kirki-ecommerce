<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

class CurrencySeeder extends Seeder
{
    /**
     * Stored lowercase to match the existing catalog - Currency's code accessor
     * uppercases it on read.
     */
    const BASE_CURRENCY_CODE = 'usd';

    /**
     * Give the store a base currency to price against.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        $this->seed_base_currency();
    }

    /**
     * @return void
     * @since 1.0.0
     */
    protected function seed_base_currency()
    {
        if (Currency::query()->where('code', static::BASE_CURRENCY_CODE)->exists()) {
            return;
        }

        Currency::create([
            'name' => 'US Dollar',
            'code' => static::BASE_CURRENCY_CODE,
            'symbol' => '$',
            'exchange_rate' => 1,
            'is_base' => true,
            'is_active' => true,
        ]);

        Log::info('OnBoarding CurrencySeeder created the base currency');
    }
}
