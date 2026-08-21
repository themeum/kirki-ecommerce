<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateCouponCustomersTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_coupon_customers', function (Structure $table) {
            $table->unsigned_big_integer('coupon_id');
            $table->unsigned_big_integer('customer_id');
            $table->boolean('is_excluded')->default(0);
            $table->timestamps();

            $table->primary(['coupon_id', 'customer_id'], 'pk_kirki_ecommerce_coupon_customers');
            $table->index('is_excluded');

            $table->foreign('coupon_id')
                ->references('id')
                ->on('kirki_ecommerce_coupons')
                ->cascade_on_delete();
            $table->foreign('customer_id')
                ->references('id')
                ->on('kirki_ecommerce_customers')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_coupon_customers');
    }
}
