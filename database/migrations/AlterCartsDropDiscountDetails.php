<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Drops the discount details snapshot column from the carts table.
 *
 * @since 1.0.0
 */
class AlterCartsDropDiscountDetails implements Migration
{
    /**
     * Drop the discount_details column from the carts table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_carts', function (Structure $table) {
            $table->drop_column('discount_details');
        });
    }

    /**
     * Re-add the discount_details column to the carts table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_carts', function (Structure $table) {
            $table->text('discount_details')
                ->nullable()
                ->comment('JSON snapshot of discount details')
                ->after('base_currency_code');
        });
    }
}
