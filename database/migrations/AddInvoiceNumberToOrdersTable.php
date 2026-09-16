<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AddInvoiceNumberToOrdersTable implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->string('invoice_number', 50)->nullable()->after('order_number');
            $table->index('invoice_number', 'idx_kirki_ecommerce_orders_invoice_number');
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->drop_index('idx_kirki_ecommerce_orders_invoice_number');
            $table->drop_column('invoice_number');
        });
    }
}
