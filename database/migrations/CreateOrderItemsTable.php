<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_order_items table, which stores the line items of orders.
 *
 * @since 1.0.0
 */
class CreateOrderItemsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_order_items table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_order_items', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('order_id');
            $table->unsigned_big_integer('product_id')->nullable();
            $table->unsigned_big_integer('variant_id')->nullable();
            $table->string('product_name', 500);
            $table->string('variant_name', 500)->nullable()->comment('Snapshot of variant combination');
            $table->string('sku', 100)->nullable();
            $table->string('barcode', 100)->nullable();
            $table->unsigned_big_integer('product_image')->nullable();

            $table->integer('invoiced_tax_total')->default(0);
            $table->integer('base_tax_total')->default(0);

            $table->integer('invoiced_discount_amount')->default(0);
            $table->integer('base_discount_amount')->default(0);

            $table->integer('invoiced_price');
            $table->integer('base_price');
            $table->integer('invoiced_regular_price')->default(0);
            $table->integer('base_regular_price')->default(0);
            $table->integer('invoiced_regular_tax_total')->default(0);
            $table->integer('base_regular_tax_total')->default(0);

            $table->integer('quantity')->default(1);

            $table->integer('invoiced_subtotal')->default(0);
            $table->integer('base_subtotal')->default(0);

            $table->integer('invoiced_total')->default(0);
            $table->integer('base_total')->default(0);

            $table->boolean('is_physical_product')->default(1);
            $table->decimal('weight', 10, 2)->nullable();
            $table->string('weight_unit', 10)->nullable()->comment('Unit of measurement for weight. Example: g, kg, lb, oz');
            $table->text('product_data')->nullable()->comment('JSON snapshot of product/variant data');
            $table->timestamps();

            $table->foreign('order_id', 'fk_kecom_order_items_order_id')
                ->references('id')
                ->on('kirki_ecommerce_orders')
                ->cascade_on_delete();
            $table->foreign('product_id', 'fk_kecom_order_items_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->null_on_delete();
            $table->foreign('variant_id', 'fk_kecom_order_items_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->null_on_delete();
        });
    }

    /**
     * Drop the kirki_ecommerce_order_items table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_order_items');
    }
}
