<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Drops the billing-same-as-shipping flag from the customers table.
 *
 * @since 1.0.0
 */
class DropIsBillingSameAsShippingFromCustomersTable implements Migration
{
    /**
     * Drop the is_billing_same_as_shipping column from the customers table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_customers', function (Structure $table) {
            $table->drop_column('is_billing_same_as_shipping');
        });
    }

    /**
     * Re-add the is_billing_same_as_shipping column to the customers table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_customers', function (Structure $table) {
            $table->boolean('is_billing_same_as_shipping')->default(1)->after('accepts_marketing');
        });
    }
}
