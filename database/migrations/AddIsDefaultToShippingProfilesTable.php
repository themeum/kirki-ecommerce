<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AddIsDefaultToShippingProfilesTable implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_shipping_profiles', function (Structure $table) {
            $table->boolean('is_default')->default(0);
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_shipping_profiles', function (Structure $table) {
            $table->drop_column('is_default');
        });
    }
}
