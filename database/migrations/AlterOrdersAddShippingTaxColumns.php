<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds shipping tax amount columns to the orders table.
 *
 * @since 1.0.0
 */
class AlterOrdersAddShippingTaxColumns implements Migration
{
    /**
     * Add the invoiced and base shipping tax amount columns to the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->integer('invoiced_shipping_tax_amount')->default(0)->after('base_tax_total');
            $table->integer('base_shipping_tax_amount')->default(0)->after('invoiced_shipping_tax_amount');
        });
    }

    /**
     * Drop the invoiced and base shipping tax amount columns from the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->drop_column(['invoiced_shipping_tax_amount', 'base_shipping_tax_amount']);
        });
    }
}
