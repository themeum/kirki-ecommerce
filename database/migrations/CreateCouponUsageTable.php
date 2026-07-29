<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateCouponUsageTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_coupon_usage', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('coupon_id');
            $table->unsigned_big_integer('order_id');
            $table->unsigned_big_integer('customer_id')->nullable();
            $table->timestamps();

            $table->unique(['coupon_id', 'order_id'], 'unique_coupon_usage');

            $table->foreign('coupon_id')
                ->references('id')
                ->on('kirki_ecommerce_coupons')
                ->cascade_on_delete();
            $table->foreign('customer_id')
                ->references('id')
                ->on('kirki_ecommerce_customers')
                ->null_on_delete();
            $table->foreign('order_id')
                ->references('id')
                ->on('kirki_ecommerce_orders')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_coupon_usage');
    }
}
