<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_carts table, which stores shopper carts.
 *
 * @since 1.0.0
 */
class CreateCartsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_carts table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_carts', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('user_id')->nullable()->comment('WordPress user ID for owned carts');
            $table->string('customer_email', 255)->nullable()->comment('Contact email entered by the shopper, used for email-based coupon rules before an order exists');
            $table->string('cart_token')->nullable()->comment('For guest cart tracking');

            $table->string('currency_code', 3);
            $table->string('base_currency_code', 3);

            $table->string('shipping_method')->nullable();
            $table->text('shipping_details')->nullable()->comment('JSON snapshot of shipping details');

            $table->integer('items_count')->default(0);

            $table->ip_address('ip_address')->nullable();
            $table->text('user_agent')->nullable();

            $table->text('customer_notes')->nullable();
            $table->text('shipping_address')->nullable();
            $table->text('billing_address')->nullable();
            $table->boolean('is_billing_same_as_shipping')->default(false);

            $table->timestamp('expires_at')->nullable()->comment('Cart expiration timestamp for cleanup of abandoned carts');
            $table->timestamps();

            $table->index('cart_token', 'idx_kecom_carts_cart_token');
            $table->index(['user_id', 'created_at'], 'idx_kecom_carts_user_id_created_at');
            $table->index('expires_at', 'idx_kecom_carts_expires_at');
            $table->index(['cart_token', 'expires_at'], 'idx_kecom_carts_cart_token_expires_at');

            $table->foreign('user_id', 'fk_kecom_carts_user_id')
                ->references('ID')
                ->on('users')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_carts table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_carts');
    }
}
