<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_collections table, which stores product collections.
 *
 * @since 1.0.0
 */
class CreateCollectionsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_collections table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_collections', function (Structure $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255);
            $table->text('description')->nullable();
            $table->unsigned_big_integer('banner')->nullable();
            $table->string('seo_title', 255)->nullable();
            $table->text('seo_description')->nullable();
            $table->text('seo_keywords')->nullable();
            $table->boolean('is_active')->default(1);
            $table->integer('ordering')->default(0);
            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();
            $table->timestamps();

            $table->unique('slug', 'uq_kecom_collections_slug');
            $table->foreign('created_by', 'fk_kecom_collections_created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by', 'fk_kecom_collections_updated_by')->on('users')->references('ID')->null_on_delete();

            $table->index('is_active', 'idx_kecom_collections_is_active');
            $table->index('ordering', 'idx_kecom_collections_ordering');
        });
    }

    /**
     * Drop the kirki_ecommerce_collections table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_collections');
    }
}
