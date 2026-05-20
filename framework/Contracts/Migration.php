<?php

namespace Kirki\Ecommerce\Contracts;

/**
 * Interface Migration
 *
 * Defines the contract for database migrations.
 * Each implementing class should provide logic for setting up (up)
 * and tearing down (down) database structures.
 */
interface Migration
{
    /**
     * Run the migration.
     *
     * This method should contain logic to create or modify database tables.
     *
     * @return void
     */

    public function up();

    /**
     * Reverse the migration.
     *
     * This method should contain logic to undo changes made by the `up()` method.
     *
     * @return void
     */
    public function down();
}
