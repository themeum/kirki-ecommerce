<?php

namespace Kirki\Ecommerce\App\Migration\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_migration_runs table, which stores the saved progress of data migrations.
 *
 * @since 1.0.0
 */
class CreateMigrationRunsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_migration_runs table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_migration_runs', function (Structure $table) {
            $table->id();
            $table->string('source', 50)->comment('Source plugin id, for example woocommerce');
            $table->string('status', 20)->default('pending')->comment('Supported values: pending, running, failed, done');
            $table->long_text('groups')->nullable()->comment('Selected groups with status, cursor, total and counts as JSON');
            $table->long_text('skipped_items')->nullable()->comment('Skipped items with source id, group and reason as JSON');
            $table->long_text('revert_state')->nullable()->comment('Revert position, removed and kept counts as JSON');
            $table->text('last_error')->nullable();
            $table->datetime('started_at')->nullable();
            $table->datetime('finished_at')->nullable();
            $table->timestamps();

            $table->index(['source', 'status'], 'idx_kecom_migration_runs_source_status');
        });
    }

    /**
     * Drop the kirki_ecommerce_migration_runs table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_migration_runs');
    }
}
