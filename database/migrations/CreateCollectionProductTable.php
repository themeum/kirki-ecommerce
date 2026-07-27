<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateCollectionProductTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_collection_product', function (Structure $table) {
            $table->unsigned_big_integer('collection_id');
            $table->unsigned_big_integer('product_id');
            $table->integer('ordering')->default(0);
            $table->timestamps();

            $table->primary(['collection_id', 'product_id'], 'pk_collection_product');
            $table->index('ordering');

            $table->foreign('product_id', 'fk_collection_product_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
            $table->foreign('collection_id', 'fk_collection_product_collection_id')
                ->references('id')
                ->on('kirki_ecommerce_collections')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_collection_product');
    }
}
