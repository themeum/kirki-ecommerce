<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateBrandsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_brands', function (Structure $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('slug', 255)->unique();
            $table->text('description')->nullable();
            $table->unsigned_big_integer('logo')->nullable();
            $table->string('website_url', 500)->nullable();
            $table->boolean('is_active')->default(1);
            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by')->on('users')->references('ID')->null_on_delete();

            $table->index('slug');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_brands');
    }
}
