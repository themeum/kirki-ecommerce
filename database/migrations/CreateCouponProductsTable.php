<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_coupon_products table, the pivot linking coupons to products.
 *
 * @since 1.0.0
 */
class CreateCouponProductsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_coupon_products table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_coupon_products', function (Structure $table) {
            $table->unsigned_big_integer('coupon_id');
            $table->unsigned_big_integer('product_id');
            $table->boolean('is_reward_item')->default(0)->comment('For buy-x-get-y coupons');
            $table->timestamps();

            $table->primary(['coupon_id', 'product_id'], 'pk_kirki_ecommerce_coupon_products');

            $table->foreign('coupon_id')
                ->references('id')
                ->on('kirki_ecommerce_coupons')
                ->cascade_on_delete();
            $table->foreign('product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_coupon_products table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_coupon_products');
    }
}
