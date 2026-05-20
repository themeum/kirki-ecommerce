<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateCouponProductsTable implements Migration
{
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

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_coupon_products');
    }
}
