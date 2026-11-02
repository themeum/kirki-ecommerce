<?php

namespace Kirki\Ecommerce\App\Migration\Providers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Database\Migrations\CreateMigrationRecordLedgerTable;
use Kirki\Ecommerce\App\Migration\Database\Migrations\CreateMigrationRunsTable;
use Kirki\Ecommerce\App\Migration\Hooks\Filters\RegisterWooCommerceMigrationSource;
use Kirki\Ecommerce\Framework\ServiceProvider;

/**
 * Plugs the migration feature into the application: its tables, hooks and REST routes.
 *
 * It is the only place the rest of the plugin has to know about. Removing this provider
 * from bootstrap/providers.php switches the feature off.
 *
 * @since 1.0.0
 */
class MigrationServiceProvider extends ServiceProvider
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        $this->app->tag([CreateMigrationRunsTable::class, CreateMigrationRecordLedgerTable::class], 'app.migrations');
        $this->app->tag([RegisterWooCommerceMigrationSource::class], 'hook.filters');
    }

    /**
     * Load the REST routes of the migration.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function boot()
    {
        $this->app->use_routing(dirname(__DIR__) . '/routes.php');
    }
}
