<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateProductsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_products', function (Structure $table) {
            $table->id();
            $table->string('title', 500);
            $table->string('slug', 500)->unique();
            $table->string('status', 50)->default('draft')->comment('Available statuses are: draft, published, trashed');

            $table->string('ribbon', 100)->nullable();

            $table->unsigned_big_integer('currency_id');
            $table->unsigned_big_integer('brand_id')->nullable();

            $table->text('short_description')->nullable();
            $table->long_text('description')->nullable();
            $table->text('additional_info')->nullable()->comment('JSON string of product attributes');

            $table->string('seo_title', 500)->nullable();
            $table->text('seo_description')->nullable();
            $table->text('seo_keywords')->nullable();

            $table->string('og_title', 500)->nullable();
            $table->text('og_description')->nullable();
            $table->unsigned_big_integer('og_image')->nullable();

            $table->unsigned_big_integer('schema_id')->nullable();
            $table->text('llm_instructions')->nullable();

            $table->boolean('has_variants')->default(0);

            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();

            $table->timestamps();

            $table->index('slug');
            $table->index('brand_id');
            $table->index('currency_id');
            $table->index('status');
            $table->index(['status', 'created_at'], 'idx_active_products');
            $table->index(['brand_id', 'status'], 'idx_brand_status');

            $table->foreign('created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by')->on('users')->references('ID')->null_on_delete();

            $table->foreign('brand_id', 'fk_kirki_ecommerce_products_brand_id')
                ->references('id')
                ->on('kirki_ecommerce_brands')
                ->null_on_delete();
            $table->foreign('currency_id', 'fk_kirki_ecommerce_products_currency_id')
                ->references('id')
                ->on('kirki_ecommerce_currencies');
            $table->foreign('schema_id', 'fk_kirki_ecommerce_products_schema_id')
                ->references('id')
                ->on('kirki_ecommerce_product_schemas')
                ->null_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_products');
    }
}
