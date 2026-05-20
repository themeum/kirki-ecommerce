<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\Database\Seeder;
use Kirki\Ecommerce\Supports\Facades\Log;

class CurrencySeeder extends Seeder
{
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
            ],
            [
                "id" => 2,
                "name" => "EURO",
                "code" => "eur",
                "symbol" => "€",
                "exchange_rate" => 0.92,
                "is_base" => false,
                "is_active" => true
            ],
            [
                "id" => 3,
                "name" => "BDT",
                "code" => "bdt",
                "symbol" => "৳",
                "exchange_rate" => 121.45,
                "is_base" => false,
                "is_active" => true
            ],
        ];

        Currency::query()->insert($currencies);

        Log::info('CurrencySeeder run successfully');
    }
}
