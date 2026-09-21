<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Converts the attributes type column from an enum to a string.
 *
 * @since 1.0.0
 */
class AlterAttributesTypeColumnToString implements Migration
{
    /**
     * Convert the type column of the attributes table from an enum to a string.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_attributes', function (Structure $table) {
            $table->string('type', 50)
                ->default('list')
                ->comment('Supported values: color, list')
                ->change();
        });
    }

    /**
     * Convert the type column of the attributes table back to an enum.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_attributes', function (Structure $table) {
            $table->enum('type', ['color', 'list'])->default('list')->change();
        });
    }
}
