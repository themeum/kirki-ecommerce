<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_cart_coupons table, which stores the coupons applied to carts.
 *
 * @since 1.0.0
 */
class CreateCartCouponsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_cart_coupons table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_cart_coupons', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('cart_id');
            $table->unsigned_big_integer('coupon_id');
            $table->timestamps();

            $table->unique(['cart_id', 'coupon_id'], 'uq_kirki_ecommerce_cart_coupons_cart_id_coupon_id');

            $table->foreign('cart_id', 'fk_kirki_ecommerce_cart_coupons_cart_id')
                ->references('id')
                ->on('kirki_ecommerce_carts')
                ->cascade_on_delete();
            $table->foreign('coupon_id', 'fk_kirki_ecommerce_cart_coupons_coupon_id')
                ->references('id')
                ->on('kirki_ecommerce_coupons')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_cart_coupons table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_cart_coupons');
    }
}
