<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_attribute_translations table, which stores per-language attribute names.
 *
 * @since 1.0.0
 */
class CreateAttributeTranslationsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_attribute_translations table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_attribute_translations', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('attribute_id');
            $table->string('language_code')->comment('Language ID for this translation');
            $table->string('name', 100);
            $table->timestamps();

            $table->unique(['attribute_id', 'language_code'], 'unique_attribute_language');
            $table->index('language_code');

            $table->foreign('attribute_id', 'fk_kirki_ecommerce_attribute_translations_attribute_id')
                ->references('id')
                ->on('kirki_ecommerce_attributes')
                ->cascade_on_delete();
            $table->foreign('language_code', 'fk_kirki_ecommerce_attribute_translations_language_code')
                ->references('code')
                ->on('kirki_ecommerce_languages')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_attribute_translations table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_attribute_translations');
    }
}
