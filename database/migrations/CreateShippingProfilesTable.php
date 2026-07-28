<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateShippingProfilesTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_shipping_profiles', function (Structure $table) {
            $table->id();
            $table->string('name', 100);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_shipping_profiles');
    }
}
