<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Converts the addresses type column from an enum to a string.
 *
 * @since 1.0.0
 */
class AlterAddressesTypeColumnToString implements Migration
{
    /**
     * Convert the type column of the addresses table from an enum to a string.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_addresses', function (Structure $table) {
            $table->string('type', 50)
                ->default('billing')
                ->comment('Supported values: billing, shipping')
                ->change();
        });
    }

    /**
     * Convert the type column of the addresses table back to an enum.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_addresses', function (Structure $table) {
            $table->enum('type', ['billing', 'shipping'])->default('billing')->change();
        });
    }
}
