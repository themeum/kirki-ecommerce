<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateOrderCouponsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_order_coupons', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('order_id');
            $table->unsigned_big_integer('coupon_id')->nullable();
            $table->unsigned_big_integer('customer_id')->nullable()->comment('Snapshot of orders.customer_id, for per-customer usage-limit lookups');

            $table->string('code', 100);
            $table->string('title', 255);
            $table->string('discount_type', 50);
            $table->string('discount_target', 50)->nullable();
            $table->text('coupon_snapshot')->nullable()->comment('JSON snapshot of the coupon rules at checkout');

            $table->integer('invoiced_discount_amount')->default(0);
            $table->integer('base_discount_amount')->default(0);

            $table->timestamp('usage_reversed_at')->nullable()->comment('Set when the owning order is cancelled, reversing this coupon usage without deleting the record');
            $table->timestamps();

            $table->unique(['order_id', 'coupon_id'], 'uq_kirki_ecommerce_order_coupons_order_id_coupon_id');
            $table->index(['coupon_id', 'customer_id'], 'idx_kirki_ecommerce_order_coupons_coupon_id_customer_id');

            $table->foreign('order_id', 'fk_kirki_ecommerce_order_coupons_order_id')
                ->references('id')
                ->on('kirki_ecommerce_orders')
                ->cascade_on_delete();
            $table->foreign('coupon_id', 'fk_kirki_ecommerce_order_coupons_coupon_id')
                ->references('id')
                ->on('kirki_ecommerce_coupons')
                ->null_on_delete();
            $table->foreign('customer_id', 'fk_kirki_ecommerce_order_coupons_customer_id')
                ->references('id')
                ->on('kirki_ecommerce_customers')
                ->null_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_order_coupons');
    }
}
