<?php

namespace Kirki\Ecommerce\App\Providers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Settings\SettingsFactory;
use Kirki\Ecommerce\Framework\ServiceProvider;

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
