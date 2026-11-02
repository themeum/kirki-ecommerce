<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_collection_translations table, which stores per-language collection content.
 *
 * @since 1.0.0
 */
class CreateCollectionTranslationsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_collection_translations table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_collection_translations', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('collection_id');
            $table->string('language_code')->comment('Language ID for this translation');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('seo_title', 255)->nullable();
            $table->text('seo_description')->nullable();
            $table->text('seo_keywords')->nullable();
            $table->timestamps();

            $table->unique(['collection_id', 'language_code'], 'uq_kecom_collection_translations_collection_id_language_code');

            $table->foreign('collection_id', 'fk_kecom_collection_translations_collection_id')
                ->references('id')
                ->on('kirki_ecommerce_collections')
                ->cascade_on_delete();
            $table->foreign('language_code', 'fk_kecom_collection_translations_language_code')
                ->references('code')
                ->on('kirki_ecommerce_languages')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_collection_translations table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_collection_translations');
    }
}
