<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateAttributeValueVariantTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_attribute_value_variant', function (Structure $table) {
            $table->unsigned_big_integer('variant_id');
            $table->unsigned_big_integer('attribute_value_id');
            $table->timestamps();

            $table->primary(['variant_id', 'attribute_value_id'], 'pk_kirki_ecommerce_attribute_value_variant');

            $table->foreign('variant_id', 'fk_kirki_ecommerce_attribute_value_variant_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->cascade_on_delete();
            $table->foreign('attribute_value_id', 'fk_kirki_ecommerce_attribute_value_variant_attribute_value_id')
                ->references('id')
                ->on('kirki_ecommerce_attribute_values')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_attribute_value_variant');
    }
}
