<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateCartItemsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_cart_items', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('cart_id');
            $table->unsigned_big_integer('product_id');
            $table->unsigned_big_integer('variant_id')->nullable();
            $table->integer('quantity')->default(1);

            $table->timestamps();

            $table->foreign('cart_id', 'fk_kirki_ecommerce_cart_items_cart_id')
                ->references('id')
                ->on('kirki_ecommerce_carts')
                ->cascade_on_delete();
            $table->foreign('product_id', 'fk_kirki_ecommerce_cart_items_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
            $table->foreign('variant_id', 'fk_kirki_ecommerce_cart_items_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->null_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_cart_items');
    }
}
