<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateCartsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_carts', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('customer_id')->nullable();
            $table->string('cart_token')->nullable()->comment('For guest cart tracking');

            $table->string('currency_code', 3);
            $table->string('base_currency_code', 3);

            $table->text('discount_details')->nullable()->comment('JSON snapshot of discount details');
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

            $table->index('cart_token');
            $table->index(['customer_id', 'created_at'], 'idx_customer_carts');
            $table->index('expires_at');
            $table->index(['cart_token', 'expires_at'], 'idx_guest_cart_cleanup');

            $table->foreign('customer_id')
                ->references('id')
                ->on('kirki_ecommerce_customers')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_carts');
    }
}
