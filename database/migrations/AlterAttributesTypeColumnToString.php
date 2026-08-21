<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterAttributesTypeColumnToString implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_attributes', function (Structure $table) {
            $table->string('type', 50)
                ->default('list')
                ->comment('Supported values: color, list')
                ->change();
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_attributes', function (Structure $table) {
            $table->enum('type', ['color', 'list'])->default('list')->change();
        });
    }
}
