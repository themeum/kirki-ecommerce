<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AddRibbonColorToProductsTable implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->string('ribbon_color', 20)
                ->nullable()
                ->after('ribbon')
                ->comment('Supported values: #6d3fe0, #1f6fe5, #1e8e4a, #d9650b, #1d1d1f');
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->drop_column('ribbon_color');
        });
    }
}
