<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateProductSchemaTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_product_schemas', function (Structure $table) {
            $table->id();
            $table->string('name', 500);
            $table->boolean('is_default')->default(false);
            $table->text('schema')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_product_schemas');
    }
}
