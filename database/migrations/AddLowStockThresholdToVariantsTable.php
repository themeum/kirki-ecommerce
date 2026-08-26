<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AddLowStockThresholdToVariantsTable implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_variants', function (Structure $table) {
            $table->integer('low_stock_threshold')->nullable()->after('committed_quantity');
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_variants', function (Structure $table) {
            $table->drop_column('low_stock_threshold');
        });
    }
}
