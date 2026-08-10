<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

use function Kirki\Ecommerce\Framework\collection;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        $existing_codes = Currency::query()->pluck('code')
            ->map(fn($code) => strtoupper($code))
            ->all();

        $missing = collection($this->get_currencies())
            ->reject(fn($currency) => in_array(strtoupper($currency['code']), $existing_codes, true))
            ->all();

        if (empty($missing)) {
            return;
        }

        if (Currency::base()->exists()) {
            $missing = array_map(function ($currency) {
                $currency['is_base'] = false;

                return $currency;
            }, $missing);
        }

        Currency::query()->insert(array_values($missing));

        Log::info('CurrencySeeder run successfully');
    }

    /**
     * Currencies a fresh store starts with.
     *
     * Only the base currency is seeded. Every active row is selectable as a
     * display currency and converts by its stored exchange rate, so seeding
     * additional currencies at the default rate of 1 would misprice them.
     * Merchants add the ones they need from the reference catalogue served by
     * `GET /currencies/list`, where they also supply a real exchange rate.
     *
     * @return array
     */
    protected function get_currencies()
    {
        return [
            [
                'name' => 'US Dollar',
                'code' => 'USD',
                'symbol' => '$',
                'exchange_rate' => 1,
                'is_base' => true,
                'is_active' => true,
            ],
        ];
    }
}
