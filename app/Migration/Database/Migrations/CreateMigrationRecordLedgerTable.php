<?php

namespace Kirki\Ecommerce\App\Migration\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_migration_record_ledger table, which records the Kirki record each migrated source record became.
 *
 * @since 1.0.0
 */
class CreateMigrationRecordLedgerTable implements Migration
{
    /**
     * Create the kirki_ecommerce_migration_record_ledger table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_migration_record_ledger', function (Structure $table) {
            $table->id();
            $table->string('source', 50)->comment('Source plugin id, for example woocommerce');
            $table->string('entity', 50)->comment('Entity type, for example product, variant, order');
            $table->unsigned_big_integer('source_id');
            $table->unsigned_big_integer('kirki_ecommerce_id');
            $table->unsigned_big_integer('run_id')->nullable();
            $table->string('origin', 20)->default('created')->comment('created or reused');
            $table->long_text('previous_value')->nullable()->comment('Value a revert puts back, for settings');
            $table->timestamps();

            $table->unique(['source', 'entity', 'source_id'], 'uq_kecom_migration_record_ledger_source_entity');
            $table->index(['entity', 'kirki_ecommerce_id'], 'idx_kecom_migration_record_ledger_kirki');
        });
    }

    /**
     * Drop the kirki_ecommerce_migration_record_ledger table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_migration_record_ledger');
    }
}
