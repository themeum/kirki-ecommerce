<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_attribute_values table, which stores the values of product attributes.
 *
 * @since 1.0.0
 */
class CreateAttributeValuesTable implements Migration
{
    /**
     * Create the kirki_ecommerce_attribute_values table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_attribute_values', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('attribute_id');
            $table->string('value', 255);
            $table->string('color', 10)->nullable()->comment('Hex color code');
            $table->unsigned_big_integer('media')->nullable();
            $table->timestamps();

            $table->unique(['attribute_id', 'value'], 'unique_attribute_value');
            $table->index('value');

            $table->foreign('attribute_id', 'fk_kirki_ecommerce_attribute_values_attribute_id')
                ->references('id')
                ->on('kirki_ecommerce_attributes')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_attribute_values table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_attribute_values');
    }
}
