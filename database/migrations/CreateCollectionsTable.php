<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateCollectionsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_collections', function (Structure $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
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

            $table->foreign('created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by')->on('users')->references('ID')->null_on_delete();

            $table->index('slug');
            $table->index('is_active');
            $table->index('ordering');
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_collections');
    }
}
