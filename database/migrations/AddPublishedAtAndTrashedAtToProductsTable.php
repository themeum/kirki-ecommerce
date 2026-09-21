<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Adds publish and trash timestamps to the products table.
 *
 * @since 1.0.0
 */
class AddPublishedAtAndTrashedAtToProductsTable implements Migration
{
    /**
     * Add the published_at and trashed_at columns to the products table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->timestamp('published_at')->nullable()->after('has_variants');
            $table->timestamp('trashed_at')->nullable()->after('published_at');
        });
    }

    /**
     * Drop the published_at and trashed_at columns from the products table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_products', function (Structure $table) {
            $table->drop_column('published_at');
            $table->drop_column('trashed_at');
        });
    }
}
