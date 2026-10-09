<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_attributes table, which stores product attributes.
 *
 * @since 1.0.0
 */
class CreateAttributesTable implements Migration
{
    /**
     * Create the kirki_ecommerce_attributes table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_attributes', function (Structure $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100);
            $table->string('type', 50)->default('list')->comment('Supported values: color, list');
            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();
            $table->timestamps();

            $table->unique('slug', 'uq_kecom_attributes_slug');
            $table->foreign('created_by', 'fk_kecom_attributes_created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by', 'fk_kecom_attributes_updated_by')->on('users')->references('ID')->null_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_attributes table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_attributes');
    }
}
