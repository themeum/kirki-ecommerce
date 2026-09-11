<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterOrdersDropLegacyCouponColumns implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->drop_column(['coupon_code', 'discount_details']);
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->string('coupon_code', 100)
                ->nullable()
                ->after('base_shipping_total');

            $table->text('discount_details')
                ->nullable()
                ->comment('JSON snapshot of discount details')
                ->after('base_discount_total');
        });
    }
}
