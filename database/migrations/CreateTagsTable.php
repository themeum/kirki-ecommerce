<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_tags table, which stores product tags.
 *
 * @since 1.0.0
 */
class CreateTagsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_tags table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_tags', function (Structure $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('slug', 255);
            $table->text('description')->nullable();
            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();
            $table->timestamps();

            $table->unique('slug', 'uq_kecom_tags_slug');
            $table->foreign('created_by', 'fk_kecom_tags_created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by', 'fk_kecom_tags_updated_by')->on('users')->references('ID')->null_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_tags table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_tags');
    }
}
