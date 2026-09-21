<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_attribute_value_variant table, the pivot linking variants to attribute values.
 *
 * @since 1.0.0
 */
class CreateAttributeValueVariantTable implements Migration
{
    /**
     * Create the kirki_ecommerce_attribute_value_variant table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_attribute_value_variant', function (Structure $table) {
            $table->unsigned_big_integer('variant_id');
            $table->unsigned_big_integer('attribute_value_id');
            $table->timestamps();

            $table->primary(['variant_id', 'attribute_value_id'], 'pk_kirki_ecommerce_attribute_value_variant');

            $table->foreign('variant_id', 'fk_kirki_ecommerce_attribute_value_variant_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->cascade_on_delete();
            $table->foreign('attribute_value_id', 'fk_kirki_ecommerce_attribute_value_variant_attribute_value_id')
                ->references('id')
                ->on('kirki_ecommerce_attribute_values')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_attribute_value_variant table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_attribute_value_variant');
    }
}
