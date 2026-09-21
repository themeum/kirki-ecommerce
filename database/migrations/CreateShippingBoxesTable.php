<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_shipping_boxes table, which stores shipping box dimensions.
 *
 * @since 1.0.0
 */
class CreateShippingBoxesTable implements Migration
{
    /**
     * Create the kirki_ecommerce_shipping_boxes table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_shipping_boxes', function (Structure $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->decimal('width', 10, 2);
            $table->decimal('height', 10, 2);
            $table->decimal('length', 10, 2);
            $table->string('unit', 10)->default('cm'); // Assuming 'cm' as default, or maybe 'in'
            $table->boolean('is_default')->default(0);
            $table->timestamps();

            $table->index('is_default');
        });
    }

    /**
     * Drop the kirki_ecommerce_shipping_boxes table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_shipping_boxes');
    }
}
