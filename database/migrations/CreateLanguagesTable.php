<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_languages table, which stores the languages the store supports.
 *
 * @since 1.0.0
 */
class CreateLanguagesTable implements Migration
{
    /**
     * Create the kirki_ecommerce_languages table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_languages', function (Structure $table) {
            $table->id();
            $table->string('code', 10)->unique()->comment('ISO 639-1 language code (e.g., en, es, fr, ar)');
            $table->string('name', 100)->comment('English name of the language');
            $table->string('native_name', 100)->comment('Native name of the language');
            $table->boolean('is_default')->default(0)->comment('Default language (only one should be 1)');
            $table->boolean('is_active')->default(1)->comment('Enable/disable language');
            $table->string('text_direction', 3)->default('ltr')->comment('Text direction: ltr or rtl');
            $table->timestamps();

            $table->index('code');
            $table->index('is_default');
            $table->index('is_active');
        });
    }

    /**
     * Drop the kirki_ecommerce_languages table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_languages');
    }
}
