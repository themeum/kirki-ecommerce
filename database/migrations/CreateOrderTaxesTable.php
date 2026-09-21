<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_order_taxes table, which stores the taxes charged on orders and order items.
 *
 * @since 1.0.0
 */
class CreateOrderTaxesTable implements Migration
{
    /**
     * Create the kirki_ecommerce_order_taxes table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_order_taxes', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('order_id');
            $table->unsigned_big_integer('order_item_id')->nullable();

            $table->string('type', 20)->default('product')->comment('Supported values: product, shipping');
            $table->string('name', 100);
            $table->decimal('rate', 8, 4);

            $table->integer('invoiced_amount')->default(0);
            $table->integer('base_amount')->default(0);

            $table->timestamps();

            $table->foreign('order_id', 'fk_kirki_ecommerce_order_taxes_order_id')
                ->references('id')
                ->on('kirki_ecommerce_orders')
                ->cascade_on_delete();
            $table->foreign('order_item_id', 'fk_kirki_ecommerce_order_taxes_order_item_id')
                ->references('id')
                ->on('kirki_ecommerce_order_items')
                ->cascade_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_order_taxes table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_order_taxes');
    }
}
