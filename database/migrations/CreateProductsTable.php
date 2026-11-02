<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_products table, which stores products.
 *
 * @since 1.0.0
 */
class CreateProductsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_products table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_products', function (Structure $table) {
            $table->id();
            $table->string('title', 500);
            $table->string('slug', 500);
            $table->string('status', 50)->default('draft')->comment('Available statuses are: draft, published, trashed');

            $table->string('ribbon', 100)->nullable();
            $table->string('ribbon_color', 20)
                ->nullable()
                ->comment('Hex colour. Default swatches: #6d3fe0, #1f6fe5, #1e8e4a, #d9650b, #1d1d1f; a custom hex is also accepted.');

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

            $table->boolean('has_variants')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('trashed_at')->nullable();
            $table->timestamp('scheduled_at')->nullable();

            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();

            $table->timestamps();

            $table->unique('slug', 'uq_kecom_products_slug');
            $table->index('brand_id', 'idx_kecom_products_brand_id');
            $table->index('status', 'idx_kecom_products_status');
            $table->index(['status', 'created_at'], 'idx_kecom_products_status_created_at');
            $table->index(['brand_id', 'status'], 'idx_kecom_products_brand_id_status');

            $table->foreign('created_by', 'fk_kecom_products_created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by', 'fk_kecom_products_updated_by')->on('users')->references('ID')->null_on_delete();

            $table->foreign('brand_id', 'fk_kecom_products_brand_id')
                ->references('id')
                ->on('kirki_ecommerce_brands')
                ->null_on_delete();
            $table->foreign('schema_id', 'fk_kecom_products_schema_id')
                ->references('id')
                ->on('kirki_ecommerce_product_schemas')
                ->null_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_products table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_products');
    }
}
