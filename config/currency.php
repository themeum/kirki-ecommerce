<?php

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Currency\Providers\CurrencyApiProvider;
use Kirki\Ecommerce\App\Currency\Providers\ExchangeRatesApiProvider;

return [
    'providers' => [
        ExchangeRatesApiProvider::class,
        CurrencyApiProvider::class,
    ],
];
