<?php

use Kirki\Ecommerce\App\Providers\AppServiceProvider;
use Kirki\Ecommerce\App\Providers\DecisionServiceProvider;
use Kirki\Ecommerce\App\Providers\ShippingServiceProvider;
use Kirki\Ecommerce\App\Providers\OrderServiceProvider;
use Kirki\Ecommerce\App\Providers\SettingsServiceProvider;
use Kirki\Ecommerce\App\Providers\PaymentServiceProvider;
use Kirki\Ecommerce\App\Providers\CurrencyServiceProvider;

return [
    AppServiceProvider::class,
    DecisionServiceProvider::class,
    ShippingServiceProvider::class,
    OrderServiceProvider::class,
    SettingsServiceProvider::class,
    PaymentServiceProvider::class,
    CurrencyServiceProvider::class,
];
