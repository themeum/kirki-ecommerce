<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds an indexed invoice number column to the orders table.
 *
 * @since 1.0.0
 */
class AddInvoiceNumberToOrdersTable implements Migration
{
    /**
     * Add the invoice_number column and its index to the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->string('invoice_number', 50)->nullable()->after('order_number');
            $table->index('invoice_number', 'idx_kirki_ecommerce_orders_invoice_number');
        });
    }

    /**
     * Drop the invoice_number index and column from the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->drop_index('idx_kirki_ecommerce_orders_invoice_number');
            $table->drop_column('invoice_number');
        });
    }
}
