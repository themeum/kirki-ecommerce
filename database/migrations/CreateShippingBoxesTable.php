<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateShippingBoxesTable implements Migration
{
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

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_shipping_boxes');
    }
}
