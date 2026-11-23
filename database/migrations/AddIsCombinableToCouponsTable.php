<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds the coupons.is_combinable column, which tells if a coupon can be applied together with other coupons.
 *
 * @since 1.0.3
 */
class AddIsCombinableToCouponsTable implements Migration
{
    /**
     * Add the is_combinable column. Existing coupons get true, so they keep stacking.
     *
     * @since 1.0.3
     *
     * @return void
     */
    public function up()
    {
        if (Schema::has_column('kirki_ecommerce_coupons', 'is_combinable')) {
            return;
        }

        Schema::table('kirki_ecommerce_coupons', function (Structure $table) {
            $table->boolean('is_combinable')->default(1)->comment('When false, the coupon cannot be applied together with another coupon');
        });
    }

    /**
     * Drop the is_combinable column.
     *
     * @since 1.0.3
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::has_column('kirki_ecommerce_coupons', 'is_combinable')) {
            return;
        }

        Schema::table('kirki_ecommerce_coupons', function (Structure $table) {
            $table->drop_column('is_combinable');
        });
    }
}
