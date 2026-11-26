<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds the order_coupons.method column, which records how the coupon was redeemed.
 *
 * @since 1.0.3
 */
class AddMethodToOrderCouponsTable implements Migration
{
    /**
     * Add the method column. Existing rows get code, because no automatic coupon was released before this column.
     *
     * @since 1.0.3
     *
     * @return void
     */
    public function up()
    {
        if (Schema::has_column('kirki_ecommerce_order_coupons', 'method')) {
            return;
        }

        Schema::table('kirki_ecommerce_order_coupons', function (Structure $table) {
            $table->string('method', 50)->default('code')->comment('Supported values: code, automatic');
        });
    }

    /**
     * Drop the method column.
     *
     * @since 1.0.3
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::has_column('kirki_ecommerce_order_coupons', 'method')) {
            return;
        }

        Schema::table('kirki_ecommerce_order_coupons', function (Structure $table) {
            $table->drop_column('method');
        });
    }
}
