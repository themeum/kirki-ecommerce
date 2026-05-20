<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Contracts\Migration;
use Kirki\Ecommerce\Database\Schema\Structure;
use Kirki\Ecommerce\Supports\Facades\Schema;

class CreateVariantsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_variants', function (Structure $table) {
            $table->id();
            $table->unsigned_big_integer('product_id');

            $table->unsigned_big_integer('media')->nullable();
            $table->string('sku', 100)->unique()->nullable();
            $table->string('barcode', 100)->nullable();

            $table->integer('price')->default(0);
            $table->boolean('show_unit_price')->default(0)->comment('Whether to show unit price');
            $table->string('base_unit', 10)->nullable()->comment('Unit of measurement for weight. Example: g, kg, lb, oz');
            $table->float('base_unit_amount')->nullable()->comment('Base unit amount');
            $table->string('total_unit', 10)->nullable()->comment('The unit of total unit amount in an item');
            $table->float('total_unit_amount')->nullable()->comment('The total unit amount in an item');
            $table->integer('sale_price')->nullable();
            $table->integer('cost_of_goods')->nullable();

            $table->decimal('weight', 10, 3)->nullable();
            $table->string('weight_unit', 10)->nullable()->comment('Unit of measurement for weight. Example: g, kg, lb, oz');

            $table->boolean('charge_taxes')->default(1)->comment('Whether to charge taxes on this variant');
            $table->boolean('allow_back_order')->default(0)->comment('Continue selling when out of stock');
            $table->boolean('track_inventory')->default(1);
            $table->integer('available_quantity')->default(0)->comment('Quantity available for sale');
            $table->boolean('in_stock')->default(1)->comment('Used when track_inventory is disabled');
            $table->integer('committed_quantity')->default(0)->comment('Quantity on hold (ordered but not shipped)');

            $table->boolean('has_limit_per_order')->default(0);
            $table->integer('max_per_order')->nullable();

            $table->unsigned_big_integer('tax_profile_id')->nullable();
            $table->unsigned_big_integer('shipping_profile_id')->nullable();
            $table->unsigned_big_integer('shipping_box_id')->nullable();

            $table->boolean('is_visible')->default(1)->comment('Whether to show this variant in the store');
            $table->boolean('is_physical_product')->default(1)->comment('Whether this variant is a physical product');

            $table->boolean('is_default')->default(0);

            $table->unsigned_big_integer('created_by');
            $table->unsigned_big_integer('updated_by');

            $table->timestamps();

            $table->index('is_visible');

            $table->foreign('product_id', 'fk_kirki_ecommerce_variants_product_id')
                ->references('id')
                ->on('kirki_ecommerce_products')
                ->cascade_on_delete();
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_variants');
    }
}
