<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds is_excluded to the coupon customers primary key so a customer can be both included and excluded.
 *
 * @since 1.0.0
 */
class AlterCouponCustomersCompositePrimaryKey implements Migration
{
    /**
     * Replace the coupon customers primary key with one that includes is_excluded, and drop the is_excluded index.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_coupon_customers', function (Structure $table) {
            $table->drop_primary();
            $table->drop_index('idx_kirki_ecommerce_coupon_customers_is_excluded');

            $table->primary(['coupon_id', 'customer_id', 'is_excluded'], 'pk_kirki_ecommerce_coupon_customers');
        });
    }

    /**
     * Restore the coupon and customer primary key and the is_excluded index on the coupon customers table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_coupon_customers', function (Structure $table) {
            $table->drop_primary();

            $table->primary(['coupon_id', 'customer_id'], 'pk_kirki_ecommerce_coupon_customers');
            $table->index('is_excluded', 'idx_kirki_ecommerce_coupon_customers_is_excluded');
        });
    }
}
