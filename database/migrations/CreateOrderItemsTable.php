<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateOrderItemsTable implements Migration
{
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

            $table->decimal('tax_rate', 8, 4)->nullable()->comment('Tax rate as a percentage');
            $table->integer('tax_total')->default(0);
            $table->integer('tax_total_base')->default(0);
            $table->text('tax_breakdown')->nullable()->comment('JSON snapshot of tax breakdown');

            $table->integer('discount_amount')->default(0);
            $table->integer('discount_amount_base')->default(0);

            $table->integer('price');
            $table->integer('price_base');

            $table->integer('quantity')->default(1);

            $table->integer('subtotal')->default(0);
            $table->integer('subtotal_base')->default(0);

            $table->integer('total')->default(0);
            $table->integer('total_base')->default(0);

            $table->boolean('is_physical_product')->default(1);
            $table->decimal('weight', 10, 2)->nullable();
            $table->string('weight_unit', 10)->nullable()->comment('Unit of measurement for weight. Example: g, kg, lb, oz');
            $table->text('product_data')->nullable()->comment('JSON snapshot of product/variant data');
            $table->timestamps();

            $table->foreign('order_id', 'fk_kirki_ecommerce_order_items_order_id')
                ->references('id')
                ->on('kirki_ecommerce_orders')
                ->cascade_on_delete();
            $table->foreign('product_id', 'fk_kirki_ecommerce_order_items_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->null_on_delete();
            $table->foreign('variant_id', 'fk_kirki_ecommerce_order_items_variant_id')
                ->references('id')
                ->on('kirki_ecommerce_variants')
                ->null_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_order_items');
    }
}
