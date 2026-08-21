<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterCouponsEnumColumnsToString implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_coupons', function (Structure $table) {
            $table->string('method', 50)
                ->default('code')
                ->comment('Supported values: code, automatic')
                ->change();

            $table->string('discount_type', 50)
                ->default('amount-off')
                ->comment('Supported values: amount-off, free-shipping, buy-x-get-y')
                ->change();

            $table->string('discount_target', 50)
                ->nullable()
                ->comment('Supported values: order, products')
                ->change();

            $table->string('discount_value_type', 50)
                ->nullable()
                ->comment('Supported values: percentage, fixed')
                ->change();

            $table->string('eligible_item_type', 50)
                ->nullable()
                ->comment('Supported values: specific-products, specific-categories, all-products')
                ->change();

            $table->string('spend_condition_type', 50)
                ->nullable()
                ->comment('Supported values: min-cart-amount, min-items')
                ->change();
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_coupons', function (Structure $table) {
            $table->enum('method', ['code', 'automatic'])->default('code')->change();
            $table->enum('discount_type', ['amount-off', 'free-shipping', 'buy-x-get-y'])->default('amount-off')->change();
            $table->enum('discount_target', ['order', 'products'])->nullable()->change();
            $table->enum('discount_value_type', ['percentage', 'fixed'])->nullable()->change();
            $table->enum('eligible_item_type', ['specific-products', 'specific-categories', 'all-products'])->nullable()->change();
            $table->enum('spend_condition_type', ['min-cart-amount', 'min-items'])->nullable()->change();
        });
    }
}
