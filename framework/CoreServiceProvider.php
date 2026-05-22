<?php

namespace Kirki\Ecommerce;

use Kirki\Ecommerce\Console\CommandManager;
use Kirki\Ecommerce\Database\Connection\Connection;
use Kirki\Ecommerce\Database\Connection\DatabaseManager;
use Kirki\Ecommerce\Database\Migrations\Migrator;
use Kirki\Ecommerce\Database\Schema\SchemaManager;
use Kirki\Ecommerce\Discovery\ListenerDiscovery;
use Kirki\Ecommerce\Discovery\PolicyDiscovery;
use Kirki\Ecommerce\Managers\EventManager;
use Kirki\Ecommerce\Managers\LogManager;
use Kirki\Ecommerce\Managers\MoneyManager;
use Kirki\Ecommerce\Managers\PolicyManager;
use Kirki\Ecommerce\ServiceProvider;
use Kirki\Ecommerce\Managers\DateManager;
use Kirki\Ecommerce\Scheduler\Scheduler;
use Kirki\Ecommerce\Http\Response;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register the hooks to the application.
     *
     * @return void
     */
    public function register()
    {
        $this->register_database_services();
        $this->register_discoveries();
        $this->register_managers();
        $this->register_migrations();

        $this->app->singleton(Response::class);

        if (class_exists(\Faker\Factory::class)) {
            $this->app->singleton(\Faker\Factory::class, fn() => \Faker\Factory::create());
        }
    }

    /**
     * Boot the service provider.
     *
     * @return void
     */
    public function boot()
    {
        $this->app->make(PolicyDiscovery::class)
            ->discover()
            ->cache();

        $this->app->make(ListenerDiscovery::class)
            ->discover()
            ->cache();

        Scheduler::boot();
    }

    /**
     * Register the managers.
     *
     * @return void
     */
    protected function register_managers()
    {
        $this->app->singleton(DatabaseManager::class);
        $this->app->singleton(SchemaManager::class);
        $this->app->singleton(LogManager::class);
        $this->app->singleton(EventManager::class);
        $this->app->singleton(PolicyManager::class);
        $this->app->singleton(DateManager::class);
        $this->app->singleton(MoneyManager::class);
        $this->app->singleton(CommandManager::class);
    }

    /**
     * Register the discoveries.
     *
     * @return void
     */
    protected function register_discoveries()
    {
        $this->app->singleton(ListenerDiscovery::class);
        $this->app->singleton(PolicyDiscovery::class);
    }

    /**
     * Register the database singletons.
     *
     * @return void
     */
    protected function register_database_services()
    {
        $this->app->singleton(Connection::class);
        $this->app->singleton(Migrator::class);
    }

    /**
     * Register the migrations tags.
     *
     * @return void
     */
    protected function register_migrations()
    {
        $migrations_path = $this->app->config_path('migrations.php');

        if (!file_exists($migrations_path)) {
            return;
        }

        $migrations = include $migrations_path;

        if (empty($migrations)) {
            return;
        }

        $this->app->tag($migrations, 'app.migrations');
    }
}
