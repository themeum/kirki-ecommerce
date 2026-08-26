<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\App\Managers\OrderActivityManager;

class OrderActivityServiceProvider extends ServiceProvider
{
    /**
     * Register the hooks to the application.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton(OrderActivityManager::class);
    }
}
