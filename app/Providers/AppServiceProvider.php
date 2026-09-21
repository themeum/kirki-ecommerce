<?php

namespace Kirki\Ecommerce\App\Providers;

use Kirki\Ecommerce\App\Blocks\BlockRegister;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Services\CountryService;
use Kirki\Ecommerce\App\Shortcodes\ShortcodeRegister;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Database\Seeders\DatabaseSeeder;
use Kirki\Ecommerce\Framework\Database\Contracts\DatabaseSeederContract;
use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\Framework\Wordpress\User as FrameworkUser;

/**
 * Registers core singletons, the framework user binding, the database seeder and the shortcode and block registers.
 *
 * @since 1.0.0
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        $this->app->singleton(MoneyManager::class);
        $this->app->singleton(CountryService::class);
        $this->app->bind(FrameworkUser::class, fn($app, $parameters = []) => $app->make(User::class, $parameters));
        $this->app->singleton(DatabaseSeederContract::class, fn() => new DatabaseSeeder());
        $this->app->make(ShortcodeRegister::class);
        $this->app->make(BlockRegister::class);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function boot()
    {
        // Boot your services here (optional)
    }
}
