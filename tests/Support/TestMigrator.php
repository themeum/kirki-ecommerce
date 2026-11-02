<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\Framework\Database\Migrations\Migrator;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class TestMigrator extends Migrator
{
    /**
     * Refresh the database schema by physically dropping every plugin table.
     *
     * The base implementation only calls down() on migrations recorded in the options table. The
     * WordPress core test bootstrap drops and recreates every WP-core table - including wp_options -
     * on every process start, which wipes that record without touching the plugin's own tables. Once
     * that happens the recorded history and the real schema diverge permanently: the base fresh()
     * reverses nothing, and Schema::create's CREATE TABLE IF NOT EXISTS makes run() no-op every
     * Create* migration afterwards. Querying the live schema instead of trusting the ledger is the
     * only way to guarantee a true empty state before every test.
     *
     * @return void
     * @since 1.0.0
     */
    public function fresh()
    {
        $tables = DB::select(
            'select TABLE_NAME as name from information_schema.TABLES'
            . ' where TABLE_SCHEMA = database() and TABLE_NAME like %s',
            [DB::connection()->get_table_prefix() . 'kirki_ecommerce_%']
        );

        Schema::disabled_checking_foreign_key_constraints();

        try {
            foreach ((array) $tables as $table) {
                DB::connection()->affecting_statement(sprintf('DROP TABLE IF EXISTS `%s`', $table['name']));
            }
        } finally {
            Schema::enabled_checking_foreign_key_constraints();
        }

        $this->repository->remove_migrations();
    }
}
