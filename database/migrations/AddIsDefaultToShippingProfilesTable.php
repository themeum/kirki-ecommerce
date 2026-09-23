<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds the is_default flag to the shipping profiles table.
 *
 * @since 1.0.0
 */
class AddIsDefaultToShippingProfilesTable implements Migration
{
    /**
     * Add the is_default column to the shipping profiles table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_shipping_profiles', function (Structure $table) {
            $table->boolean('is_default')->default(0)->after('name');
        });
    }

    /**
     * Drop the is_default column from the shipping profiles table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_shipping_profiles', function (Structure $table) {
            $table->drop_column('is_default');
        });
    }
}
