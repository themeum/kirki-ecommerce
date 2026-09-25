<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds the is_tax_inclusive column to the orders table.
 *
 * @since 1.0.0
 */
class AlterOrdersAddIsTaxInclusiveColumn implements Migration
{
    /**
     * Add the is_tax_inclusive column to the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->boolean('is_tax_inclusive')->default(0)->comment('Whether the store priced items inclusive of tax when this order was last calculated')->after('base_shipping_tax_amount');
        });
    }

    /**
     * Drop the is_tax_inclusive column from the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->drop_column(['is_tax_inclusive']);
        });
    }
}
