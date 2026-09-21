<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_product_schemas table, which stores product schema templates.
 *
 * @since 1.0.0
 */
class CreateProductSchemaTable implements Migration
{
    /**
     * Create the kirki_ecommerce_product_schemas table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_product_schemas', function (Structure $table) {
            $table->id();
            $table->string('name', 500);
            $table->boolean('is_default')->default(false);
            $table->text('schema')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Drop the kirki_ecommerce_product_schemas table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_product_schemas');
    }
}
