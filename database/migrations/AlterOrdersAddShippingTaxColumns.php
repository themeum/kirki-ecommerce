<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterOrdersAddShippingTaxColumns implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->integer('invoiced_shipping_tax_amount')->default(0)->after('base_tax_total');
            $table->integer('base_shipping_tax_amount')->default(0)->after('invoiced_shipping_tax_amount');
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->drop_column(['invoiced_shipping_tax_amount', 'base_shipping_tax_amount']);
        });
    }
}
