<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateLanguagesTable implements Migration
{
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

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_languages');
    }
}
