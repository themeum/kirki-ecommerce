<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_reviews table for product ratings and reviews.
 *
 * @since 1.0.1
 */
class CreateReviewsTable implements Migration
{
    /** @var string */
    protected $table = 'kirki_ecommerce_reviews';

    /**
     * Create the kirki_ecommerce_reviews table.
     *
     * @since 1.0.1
     *
     * @return void
     */
    public function up()
    {
        Schema::create($this->table, function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('product_id');
            $table->unsigned_big_integer('user_id')->nullable();
            $table->string('author_name', 255);
            $table->string('author_email', 255);
            $table->unsigned_tiny_integer('rating');
            $table->string('title', 255)->nullable();
            $table->text('content');
            $table->string('status', 50)->default('pending');
            $table->boolean('is_verified_purchase')->default(false);
            $table->datetimes();

            $table->index(['product_id', 'status'], 'idx_kecom_reviews_product_status');
            $table->foreign('product_id', 'fk_kecom_reviews_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
            $table->foreign('user_id', 'fk_kecom_reviews_user_id')
                ->references('ID')
                ->on('users')
                ->null_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_reviews table.
     *
     * @since 1.0.1
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists($this->table);
    }
}
