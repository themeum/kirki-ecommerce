<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

class ShippingServiceProvider extends ServiceProvider
{
    /**
     * Register the hooks to the application.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton(ShippingService::class, function () {
            return new ShippingService(Settings::get(OptionKeys::SHIPPING_SETTINGS)->to_array());
        });
    }
}
