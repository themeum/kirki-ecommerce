<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateMediaProductTable implements Migration
{
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

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_media_product');
    }
}
