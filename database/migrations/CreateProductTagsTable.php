<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateProductTagsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_product_tags', function (Structure $table) {
            $table->unsigned_big_integer('product_id');
            $table->unsigned_big_integer('tag_id');
            $table->timestamps();

            $table->primary(['product_id', 'tag_id'], 'pk_product_tag');

            $table->foreign('product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
            $table->foreign('tag_id')
                ->references('id')
                ->on('kirki_ecommerce_tags')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_product_tags');
    }
}
