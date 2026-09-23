<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_shipping_profiles table, which stores shipping profiles.
 *
 * @since 1.0.0
 */
class CreateShippingProfilesTable implements Migration
{
    /**
     * Create the kirki_ecommerce_shipping_profiles table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_shipping_profiles', function (Structure $table) {
            $table->id();
            $table->string('name', 100);
            $table->timestamps();
        });
    }

    /**
     * Drop the kirki_ecommerce_shipping_profiles table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_shipping_profiles');
    }
}
