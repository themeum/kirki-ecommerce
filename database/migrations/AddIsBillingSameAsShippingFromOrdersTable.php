<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Drops the billing-same-as-shipping flag from the orders table.
 *
 * @since 1.0.0
 */
class AddIsBillingSameAsShippingFromOrdersTable implements Migration
{
    /**
     * Drop the is_billing_same_as_shipping column from the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->boolean('is_billing_same_as_shipping')->default(false)->after('shipping_company');
        });
    }

    /**
     * Re-add the is_billing_same_as_shipping column to the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->drop_column('is_billing_same_as_shipping');
        });
    }
}
