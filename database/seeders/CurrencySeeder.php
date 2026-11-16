<?php

namespace Kirki\Ecommerce\Database\Seeders;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

use function Kirki\Ecommerce\Framework\app;

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

        // The insert skips CurrencyService, so its per-request currency data is out of date.
        app(CurrencyService::class)->flush_cache();

        Log::info('CurrencySeeder run successfully');
    }
}
