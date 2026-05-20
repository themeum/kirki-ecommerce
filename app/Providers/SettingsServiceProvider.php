<?php

namespace Kirki\Ecommerce\App\Providers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Settings\CheckoutSettings;
use Kirki\Ecommerce\App\Settings\CurrencySettings;
use Kirki\Ecommerce\App\Settings\EmailSettings;
use Kirki\Ecommerce\App\Settings\GeneralSettings;
use Kirki\Ecommerce\App\Settings\PaymentSettings;
use Kirki\Ecommerce\App\Settings\ProductSettings;
use Kirki\Ecommerce\App\Settings\SettingsFactory;
use Kirki\Ecommerce\App\Settings\ShippingSettings;
use Kirki\Ecommerce\App\Settings\TaxSettings;
use Kirki\Ecommerce\ServiceProvider;

class SettingsServiceProvider extends ServiceProvider
{
    /**
     * Register the settings services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton(SettingsFactory::class);

        $this->app->alias('settings', SettingsFactory::class);
    }
}
