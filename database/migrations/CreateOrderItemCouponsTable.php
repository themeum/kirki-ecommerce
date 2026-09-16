<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateOrderItemCouponsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_order_item_coupons', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('order_item_id');
            $table->unsigned_big_integer('order_coupon_id');

            $table->integer('invoiced_discount_amount')->default(0);
            $table->integer('base_discount_amount')->default(0);

            $table->timestamps();

            $table->foreign('order_item_id', 'fk_kirki_ecommerce_order_item_coupons_order_item_id')
                ->references('id')
                ->on('kirki_ecommerce_order_items')
                ->cascade_on_delete();
            $table->foreign('order_coupon_id', 'fk_kirki_ecommerce_order_item_coupons_order_coupon_id')
                ->references('id')
                ->on('kirki_ecommerce_order_coupons')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_order_item_coupons');
    }
}
