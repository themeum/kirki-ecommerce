<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Drops the product schema profiles: the products.schema_id column and the kirki_ecommerce_product_schemas table.
 *
 * @since 1.0.1
 */
class DropProductSchemasTable implements Migration
{
    /**
     * Drop the schema_id column with its foreign key, then the kirki_ecommerce_product_schemas table.
     *
     * @since 1.0.1
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->drop_foreign('fk_kecom_products_schema_id');
            $table->drop_column('schema_id');
        });

        Schema::drop_if_exists('kirki_ecommerce_product_schemas');
    }

    /**
     * Recreate the empty kirki_ecommerce_product_schemas table and the products.schema_id column.
     *
     * @since 1.0.1
     *
     * @return void
     */
    public function down()
    {
        Schema::create('kirki_ecommerce_product_schemas', function (Structure $table) {
            $table->id();
            $table->string('name', 500);
            $table->boolean('is_default')->default(false);
            $table->text('schema')->nullable();
            $table->datetimes();
        });

        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->unsigned_big_integer('schema_id')->nullable()->after('og_image');

            $table->foreign('schema_id', 'fk_kecom_products_schema_id')
                ->references('id')
                ->on('kirki_ecommerce_product_schemas')
                ->null_on_delete();
        });
    }
}
