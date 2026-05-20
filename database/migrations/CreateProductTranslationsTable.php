<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateProductTranslationsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_product_translations', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('product_id');
            $table->string('language_code')->comment('Language ID for this translation');

            $table->string('title', 500);
            $table->long_text('description')->nullable();

            $table->string('seo_title', 500)->nullable();
            $table->text('seo_description')->nullable();
            $table->text('seo_keywords')->nullable();

            $table->timestamps();

            $table->unique(['product_id', 'language_code'], 'unique_product_language');
            $table->index('language_code');

            $table->foreign('product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
            $table->foreign('language_code')
                ->references('code')
                ->on('kirki_ecommerce_languages')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_product_translations');
    }
}
