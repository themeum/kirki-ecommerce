<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

/**
 * Seeds the US Dollar base currency.
 *
 * @since 1.0.0
 */
class CurrencySeeder extends Seeder
{
    /**
     * Insert the US Dollar as the active base currency.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        $currencies = [
            [
                "id" => 1,
                "name" => "US Dollar",
                "code" => "usd",
                "symbol" => "$",
                "exchange_rate" => 1,
                "is_base" => true,
                "is_active" => true
            ]
        ];

        Currency::query()->insert($currencies);

        Log::info('CurrencySeeder run successfully');
    }
}
