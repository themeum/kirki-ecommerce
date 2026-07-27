<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register the services to the application.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton(MoneyManager::class);
    }

    /**
     * Boot the services.
     *
     * @return void
     */
    public function boot()
    {
        // Boot your services here (optional)
    }
}
