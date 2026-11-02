<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_categories table, which stores product categories.
 *
 * @since 1.0.0
 */
class CreateCategoriesTable implements Migration
{
    /**
     * Create the kirki_ecommerce_categories table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_categories', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('parent_id')->nullable();
            $table->string('name', 255);
            $table->string('slug', 255);
            $table->text('description')->nullable();
            $table->unsigned_big_integer('image')->nullable();
            $table->integer('level')->default(1);
            $table->integer('ordering')->default(0);
            $table->boolean('is_active')->default(1);
            $table->boolean('is_deletable')->default(1);
            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();
            $table->timestamps();

            $table->unique('slug', 'uq_kecom_categories_slug');
            $table->foreign('created_by', 'fk_kecom_categories_created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by', 'fk_kecom_categories_updated_by')->on('users')->references('ID')->null_on_delete();

            $table->index('is_active', 'idx_kecom_categories_is_active');
            $table->index('ordering', 'idx_kecom_categories_ordering');

            $table->foreign('parent_id', 'fk_kecom_categories_parent_id')
                ->references('id')
                ->on('kirki_ecommerce_categories')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_categories table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_categories');
    }
}
