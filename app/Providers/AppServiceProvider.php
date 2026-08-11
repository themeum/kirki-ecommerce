<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Database\Seeders\DatabaseSeeder;
use Kirki\Ecommerce\Framework\Database\Contracts\DatabaseSeederContract;
use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\Framework\Wordpress\User as FrameworkUser;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register the services to the application.
     *
     * @return void
     * @since 1.0.0
     */
    public function register()
    {
        $this->app->singleton(MoneyManager::class);
        $this->app->bind(FrameworkUser::class, function ($app, $parameters = []) {
            return $app->make(User::class, $parameters);
        });
        $this->app->singleton(DatabaseSeederContract::class, function(){
            return new DatabaseSeeder();
        });
    }

    /**
     * Boot the services.
     *
     * @return void
     * @since 1.0.0
     */
    public function boot()
    {
        // Boot your services here (optional)
    }
}
