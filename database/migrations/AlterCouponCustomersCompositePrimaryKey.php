<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterCouponCustomersCompositePrimaryKey implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_coupon_customers', function (Structure $table) {
            $table->drop_primary();
            $table->drop_index('idx_kirki_ecommerce_coupon_customers_is_excluded');

            $table->primary(['coupon_id', 'customer_id', 'is_excluded'], 'pk_kirki_ecommerce_coupon_customers');
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_coupon_customers', function (Structure $table) {
            $table->drop_primary();

            $table->primary(['coupon_id', 'customer_id'], 'pk_kirki_ecommerce_coupon_customers');
            $table->index('is_excluded', 'idx_kirki_ecommerce_coupon_customers_is_excluded');
        });
    }
}
