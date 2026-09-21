<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds a per-variant low stock threshold to the variants table.
 *
 * @since 1.0.0
 */
class AddLowStockThresholdToVariantsTable implements Migration
{
    /**
     * Add the low_stock_threshold column to the variants table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_variants', function (Structure $table) {
            $table->integer('low_stock_threshold')->nullable()->after('committed_quantity');
        });
    }

    /**
     * Drop the low_stock_threshold column from the variants table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_variants', function (Structure $table) {
            $table->drop_column('low_stock_threshold');
        });
    }
}
