<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateAttributeValueProductTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_attribute_value_product', function (Structure $table) {
            $table->unsigned_big_integer('product_id');
            $table->unsigned_big_integer('attribute_value_id');
            $table->integer('ordering')->default(0);
            $table->timestamps();

            $table->primary(['product_id', 'attribute_value_id'], 'pk_kirki_ecommerce_attribute_value_product');
            $table->index('ordering');

            $table->foreign('product_id', 'fk_kirki_ecommerce_attribute_value_product_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
            $table->foreign('attribute_value_id', 'fk_kirki_ecommerce_attribute_value_product_attribute_value_id')
                ->references('id')
                ->on('kirki_ecommerce_attribute_values')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_attribute_value_product');
    }
}
