<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterCartsDropDiscountDetails implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_carts', function (Structure $table) {
            $table->drop_column('discount_details');
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_carts', function (Structure $table) {
            $table->text('discount_details')
                ->nullable()
                ->comment('JSON snapshot of discount details')
                ->after('base_currency_code');
        });
    }
}
