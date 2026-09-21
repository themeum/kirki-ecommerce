<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_coupon_categories table, the pivot linking coupons to categories.
 *
 * @since 1.0.0
 */
class CreateCouponCategoriesTable implements Migration
{
    /**
     * Create the kirki_ecommerce_coupon_categories table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_coupon_categories', function (Structure $table) {
            $table->unsigned_big_integer('coupon_id');
            $table->unsigned_big_integer('category_id');
            $table->timestamps();

            $table->primary(['coupon_id', 'category_id'], 'pk_kirki_ecommerce_coupon_categories');

            $table->index('coupon_id');
            $table->index('category_id');

            $table->foreign('coupon_id')
                ->references('id')
                ->on('kirki_ecommerce_coupons')
                ->cascade_on_delete();
            $table->foreign('category_id')
                ->references('id')
                ->on('kirki_ecommerce_categories')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_coupon_categories table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_coupon_categories');
    }
}
