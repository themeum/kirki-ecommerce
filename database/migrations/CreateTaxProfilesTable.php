<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateTaxProfilesTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_tax_profiles', function (Structure $table) {
            $table->id();
            $table->string('name', 100);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_tax_profiles');
    }
}
