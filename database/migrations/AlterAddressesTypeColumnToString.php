<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterAddressesTypeColumnToString implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_addresses', function (Structure $table) {
            $table->string('type', 50)
                ->default('billing')
                ->comment('Supported values: billing, shipping')
                ->change();
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_addresses', function (Structure $table) {
            $table->enum('type', ['billing', 'shipping'])->default('billing')->change();
        });
    }
}
