<?php

namespace Kirki\Ecommerce\App\Providers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\McpManager;
use Kirki\Ecommerce\App\Blocks\BlockRegister;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Mcp\McpAbilities;
use Kirki\Ecommerce\App\Services\CountryService;
use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\App\Shortcodes\ShortcodeRegister;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Database\Seeders\DatabaseSeeder;
use Kirki\Ecommerce\Framework\Database\Contracts\DatabaseSeederContract;
use Kirki\Ecommerce\Framework\ServiceProvider;
use Kirki\Ecommerce\Framework\Wordpress\User as FrameworkUser;

/**
 * Registers core singletons, the framework user binding, the development database seeder, the shortcode and block registers and, when it is turned on, the store's MCP server.
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
        $this->app->singleton(McpAbilities::class);
        $this->app->bind(FrameworkUser::class, fn($app, $parameters = []) => $app->make(User::class, $parameters));
        $this->app->singleton(PresetRepository::class);
        $this->app->make(ShortcodeRegister::class);
        $this->app->make(BlockRegister::class);
    }

    /**
     * Bind the developer database seeder in development mode, and register the store's MCP server when MCP is turned on.
     *
     * The app mode is set after the providers register, so it is read here.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function boot()
    {
        if ($this->app->is_dev_mode()) {
            $this->app->singleton(DatabaseSeederContract::class, fn() => new DatabaseSeeder());
        }

        $this->app->make(McpAbilities::class)->register_server($this->app->make(McpManager::class));
    }
}
