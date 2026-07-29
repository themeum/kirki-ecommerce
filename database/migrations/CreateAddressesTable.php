<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateAddressesTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_addresses', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('customer_id');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('address_line1', 255);
            $table->string('address_line2', 255)->nullable();
            $table->string('city', 100);
            $table->string('state', 100);
            $table->string('country', 100);
            $table->string('postal_code', 20);
            $table->string('email', 255)->nullable();
            $table->string('phone', 20)->nullable();
            $table->enum('type', ['billing', 'shipping'])->default('billing');
            $table->timestamps();

            $table->foreign('customer_id', 'fk_kirki_ecommerce_addresses_customer_id')
                ->references('id')
                ->on('kirki_ecommerce_customers')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_addresses');
    }
}
