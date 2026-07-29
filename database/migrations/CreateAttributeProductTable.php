<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateAttributeProductTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_attribute_product', function (Structure $table) {
            $table->unsigned_big_integer('product_id');
            $table->unsigned_big_integer('attribute_id');
            $table->integer('ordering')->default(0);
            $table->timestamps();

            $table->primary(['product_id', 'attribute_id'], 'pk_kirki_ecommerce_attribute_product');
            $table->index('ordering');

            $table->foreign('product_id', 'fk_kirki_ecommerce_attribute_product_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
            $table->foreign('attribute_id', 'fk_kirki_ecommerce_attribute_product_attribute_id')
                ->references('id')
                ->on('kirki_ecommerce_attributes')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_attribute_product');
    }
}
