<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterOrderItemsDropTaxColumns implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_order_items', function (Structure $table) {
            $table->drop_column(['tax_rate', 'tax_breakdown']);
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_order_items', function (Structure $table) {
            $table->decimal('tax_rate', 8, 4)
                ->nullable()
                ->comment('Tax rate as a percentage')
                ->after('product_image');

            $table->text('tax_breakdown')
                ->nullable()
                ->comment('JSON snapshot of tax breakdown')
                ->after('base_tax_total');
        });
    }
}
