<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateAttributesTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_attributes', function (Structure $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->enum('type', ['color', 'list'])->default('list');
            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by')->on('users')->references('ID')->null_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_attributes');
    }
}
