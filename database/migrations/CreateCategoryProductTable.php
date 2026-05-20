<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateCategoryProductTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_category_product', function (Structure $table) {
            $table->unsigned_big_integer('category_id');
            $table->unsigned_big_integer('product_id');
            $table->timestamps();

            $table->primary(['category_id', 'product_id'], 'pk_category_product');

            $table->foreign('product_id', 'fk_category_product_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
            $table->foreign('category_id', 'fk_category_product_category_id')
                ->references('id')
                ->on('kirki_ecommerce_categories')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_category_product');
    }
}
