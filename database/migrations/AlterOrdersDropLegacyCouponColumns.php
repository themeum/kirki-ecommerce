<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Drops the legacy coupon code and discount details columns from the orders table.
 *
 * @since 1.0.0
 */
class AlterOrdersDropLegacyCouponColumns implements Migration
{
    /**
     * Drop the coupon_code and discount_details columns from the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_orders', function (Structure $table) {
            $table->drop_column(['coupon_code', 'discount_details']);
        });
    }

    /**
     * Re-add the coupon_code and discount_details columns to the orders table.
     *
     * @since 1.0.0
     *
     * @return void
     */
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
