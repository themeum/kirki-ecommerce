<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateCouponsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_coupons', function (Structure $table) {
            $table->id();
            $table->enum('method', ['code', 'automatic'])->default('code');
            $table->string('title', 255);
            $table->string('code', 100)->unique()->nullable();

            $table->enum('discount_type', ['amount-off', 'free-shipping', 'buy-x-get-y'])->default('amount-off');
            $table->enum('discount_target', ['order', 'products'])->nullable();
            $table->enum('discount_value_type', ['percentage', 'fixed'])->nullable();
            $table->integer('discount_amount_fixed')->nullable();
            $table->float('discount_amount_percentage')->nullable();

            $table->enum('eligible_item_type', ['specific-products', 'specific-categories', 'all-products'])->nullable();
            $table->enum('spend_condition_type', ['min-cart-amount', 'min-items'])->nullable();
            $table->integer('spend_condition_value')->nullable();
            $table->integer('reward_quantity')->nullable();
            $table->integer('reward_value')->nullable();

            $table->datetime('start_datetime')->nullable();
            $table->boolean('has_end_datetime')->default(0);
            $table->datetime('end_datetime')->nullable();

            $table->text('target_countries')->nullable()->comment('Array of country codes as JSON');
            $table->boolean('first_time_buyer_only')->default(0);
            $table->enum('customer_eligibility', ['all', 'specific-customers', 'specific-groups'])->default('all');
            $table->boolean('exclude_customers')->default(0);

            $table->boolean('has_usage_limit')->default(0);
            $table->integer('usage_limit')->nullable();
            $table->boolean('has_customer_limit')->default(0);
            $table->integer('customer_limit')->nullable();

            $table->integer('current_usage_count')->default(0);
            $table->boolean('is_active')->default(1);
            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by')->on('users')->references('ID')->null_on_delete();

            $table->index(['is_active', 'start_datetime', 'has_end_datetime', 'end_datetime'], 'idx_active_coupons');
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_coupons');
    }
}
