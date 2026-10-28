<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_wishlist table, which stores the products users saved to their wishlist.
 *
 * An entry belongs to a product, and a user has at most one entry per product. The variant is optional:
 * it is the variant the user chose, and it becomes NULL when that variant is deleted.
 *
 * @since 1.0.0
 */
class CreateWishlistTable implements Migration
{
    /** @var string */
    protected $table = 'kirki_ecommerce_wishlist';

    /**
     * Create the kirki_ecommerce_wishlist table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create($this->table, function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('user_id');
            $table->unsigned_big_integer('product_id');
            $table->unsigned_big_integer('variant_id')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'product_id'], 'uq_kecom_wishlist_user_id_product_id');

            $table->foreign('user_id', 'fk_kecom_wishlist_user_id')
                ->references('ID')
                ->on('users')
                ->cascade_on_delete();

            $table->foreign('product_id', 'fk_kecom_wishlist_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();

            $table->foreign('variant_id', 'fk_kecom_wishlist_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->null_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_wishlist table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists($this->table);
    }
}
