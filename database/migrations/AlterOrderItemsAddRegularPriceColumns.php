<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds regular unit price and regular-price tax columns to the order items table.
 *
 * @since 1.0.0
 */
class AlterOrderItemsAddRegularPriceColumns implements Migration
{
    /**
     * Add the invoiced and base regular price and regular-price tax columns to the order items table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_order_items', function (Structure $table) {
            $table->integer('invoiced_regular_price')->default(0)->after('base_price');
            $table->integer('base_regular_price')->default(0)->after('invoiced_regular_price');
            $table->integer('invoiced_regular_tax_total')->default(0)->after('base_regular_price');
            $table->integer('base_regular_tax_total')->default(0)->after('invoiced_regular_tax_total');
        });
    }

    /**
     * Drop the invoiced and base regular price and regular-price tax columns from the order items table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_order_items', function (Structure $table) {
            $table->drop_column(['invoiced_regular_price', 'base_regular_price', 'invoiced_regular_tax_total', 'base_regular_tax_total']);
        });
    }
}
