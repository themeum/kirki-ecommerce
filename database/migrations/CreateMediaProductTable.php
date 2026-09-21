<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_media_product table, the ordered pivot linking media attachments to products.
 *
 * @since 1.0.0
 */
class CreateMediaProductTable implements Migration
{
    /**
     * Create the kirki_ecommerce_media_product table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_media_product', function (Structure $table) {
            $table->unsigned_big_integer('product_id');
            $table->unsigned_big_integer('media_id');
            $table->integer('ordering')->default(0);
            $table->timestamps();

            $table->primary(['media_id', 'product_id'], 'pk_media_product');

            $table->index('ordering');
            $table->foreign('product_id', 'fk_media_product_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
            $table->foreign('media_id', 'fk_media_product_media_id')
                ->references('id')
                ->on('posts')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_media_product table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_media_product');
    }
}
