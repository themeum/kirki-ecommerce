<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_cart_items table, which stores the line items of carts.
 *
 * @since 1.0.0
 */
class CreateCartItemsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_cart_items table.
     *
     * @since 1.0.0
     *
     * @return void
     */
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

    /**
     * Drop the kirki_ecommerce_cart_items table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_cart_items');
    }
}
