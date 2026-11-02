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

            $table->integer('invoiced_tax_total')->default(0)->comment('Tax on this line after discounts, in the invoiced currency, minor units');
            $table->integer('base_tax_total')->default(0)->comment('Tax on this line after discounts, in the base currency, minor units');

            $table->integer('invoiced_discount_amount')->default(0)->comment('Total discount on this line from all coupons; includes tax when orders.is_tax_inclusive is true, in the invoiced currency, minor units');
            $table->integer('base_discount_amount')->default(0)->comment('Total discount on this line from all coupons; includes tax when orders.is_tax_inclusive is true, in the base currency, minor units');

            $table->integer('invoiced_price')->comment('Unit sale price (regular price when no sale was active), always net of tax, in the invoiced currency, minor units');
            $table->integer('base_price')->comment('Unit sale price (regular price when no sale was active), always net of tax, in the base currency, minor units');
            $table->integer('invoiced_regular_price')->default(0)->comment('Unit regular price before any sale, always net of tax, in the invoiced currency, minor units');
            $table->integer('base_regular_price')->default(0)->comment('Unit regular price before any sale, always net of tax, in the base currency, minor units');
            $table->integer('invoiced_regular_tax_total')->default(0)->comment('Tax on the regular price line total (regular price x quantity), in the invoiced currency, minor units');
            $table->integer('base_regular_tax_total')->default(0)->comment('Tax on the regular price line total (regular price x quantity), in the base currency, minor units');

            $table->integer('invoiced_catalog_regular_price')->default(0)->comment('Unit regular price exactly as set on the variant, in the invoiced currency; includes tax when orders.is_tax_inclusive is true');
            $table->integer('base_catalog_regular_price')->default(0)->comment('Unit regular price exactly as set on the variant, in the base currency; includes tax when orders.is_tax_inclusive is true');
            $table->integer('invoiced_catalog_sale_price')->default(0)->comment('Unit price sold at (sale price, or regular price when no sale was active) exactly as set on the variant, in the invoiced currency; includes tax when orders.is_tax_inclusive is true');
            $table->integer('base_catalog_sale_price')->default(0)->comment('Unit price sold at (sale price, or regular price when no sale was active) exactly as set on the variant, in the base currency; includes tax when orders.is_tax_inclusive is true');
            $table->integer('invoiced_catalog_product_coupon_discounted_subtotal')->default(0)->comment('Line total (catalog sale price x quantity) after product-scoped coupons only, before order-wide coupons, in the invoiced currency; includes tax when orders.is_tax_inclusive is true');
            $table->integer('base_catalog_product_coupon_discounted_subtotal')->default(0)->comment('Line total (catalog sale price x quantity) after product-scoped coupons only, before order-wide coupons, in the base currency; includes tax when orders.is_tax_inclusive is true');
            $table->integer('invoiced_discount_tax_total')->default(0)->comment('Tax removed from this line by all discounts (tax before any discount minus tax_total), in the invoiced currency');
            $table->integer('base_discount_tax_total')->default(0)->comment('Tax removed from this line by all discounts (tax before any discount minus tax_total), in the base currency');

            $table->integer('quantity')->default(1);

            $table->integer('invoiced_subtotal')->default(0)->comment('Line total before discounts (unit price x quantity), always net of tax, in the invoiced currency, minor units');
            $table->integer('base_subtotal')->default(0)->comment('Line total before discounts (unit price x quantity), always net of tax, in the base currency, minor units');

            $table->integer('invoiced_total')->default(0)->comment('Line total after discounts; always includes tax (already inside the price when orders.is_tax_inclusive is true, added on top otherwise), in the invoiced currency, minor units');
            $table->integer('base_total')->default(0)->comment('Line total after discounts; always includes tax (already inside the price when orders.is_tax_inclusive is true, added on top otherwise), in the base currency, minor units');

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
