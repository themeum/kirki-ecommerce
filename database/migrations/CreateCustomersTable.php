<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_customers table, which stores customer profiles.
 *
 * @since 1.0.0
 */
class CreateCustomersTable implements Migration
{
    /**
     * Create the kirki_ecommerce_customers table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_customers', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('user_id')->nullable()->comment('WordPress user ID, NULL for guest customers');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->unsigned_big_integer('photo')->nullable();
            $table->string('email', 255);
            $table->string('phone', 50)->nullable();
            $table->boolean('accepts_marketing')->default(0);
            $table->boolean('is_billing_same_as_shipping')->default(1);
            $table->text('notes')->nullable();
            $table->text('tags')->nullable()->comment('Comma separated tags');
            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by')->on('users')->references('ID')->null_on_delete();

            $table->unique('user_id');
            $table->index('email');

            $table->foreign('user_id')
                ->on('users')
                ->references('ID')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_customers table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_customers');
    }
}
