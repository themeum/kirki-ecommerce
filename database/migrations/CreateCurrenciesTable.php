<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateCurrenciesTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_currencies', function (Structure $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name', 100);
            $table->string('symbol', 10)->nullable();
            $table->decimal('exchange_rate', 15, 6)->default(1.000000);
            $table->boolean('is_base')->default(0);
            $table->boolean('is_active')->default(1);
            $table->timestamps();

            $table->index('is_base');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_currencies');
    }
}
