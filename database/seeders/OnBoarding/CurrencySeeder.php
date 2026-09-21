<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

/**
 * Seeds the US Dollar base currency for a newly installed store.
 *
 * @since 1.0.0
 */
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
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        $this->seed_base_currency();
    }

    /**
     * Create the US Dollar base currency unless it already exists.
     *
     * @since 1.0.0
     *
     * @return void
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
