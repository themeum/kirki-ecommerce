<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class DropShowUnitPriceFromVariantsTable implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_variants', function (Structure $table) {
            $table->drop_column('show_unit_price');
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_variants', function (Structure $table) {
            $table->boolean('show_unit_price')->default(0)->after('base_price');
        });
    }
}
