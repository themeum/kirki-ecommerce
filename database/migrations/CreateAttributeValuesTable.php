<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateAttributeValuesTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_attribute_values', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('attribute_id');
            $table->string('value', 255);
            $table->string('color', 10)->nullable()->comment('Hex color code');
            $table->timestamps();

            $table->unique(['attribute_id', 'value'], 'unique_attribute_value');
            $table->index('value');

            $table->foreign('attribute_id', 'fk_kirki_ecommerce_attribute_values_attribute_id')
                ->references('id')
                ->on('kirki_ecommerce_attributes')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_attribute_values');
    }
}
