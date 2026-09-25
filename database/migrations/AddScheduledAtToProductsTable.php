<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds a schedule timestamp to the products table.
 *
 * @since 1.0.0
 */
class AddScheduledAtToProductsTable implements Migration
{
    /**
     * Add the scheduled_at column to the products table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->timestamp('scheduled_at')->nullable()->after('trashed_at');
        });
    }

    /**
     * Drop the scheduled_at column from the products table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->drop_column('scheduled_at');
        });
    }
}
