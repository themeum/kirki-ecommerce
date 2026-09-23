<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_category_product table, the pivot linking categories to products.
 *
 * @since 1.0.0
 */
class CreateCategoryProductTable implements Migration
{
    /**
     * Create the kirki_ecommerce_category_product table.
     *
     * @since 1.0.0
     *
     * @return void
     */
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

    /**
     * Drop the kirki_ecommerce_category_product table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_category_product');
    }
}
