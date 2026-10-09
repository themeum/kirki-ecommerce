<?php

namespace Kirki\Ecommerce\Database\Migrations;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_coupons table, which stores coupons and automatic discounts.
 *
 * @since 1.0.0
 */
class CreateCouponsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_coupons table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_coupons', function (Structure $table) {
            $table->id();
            $table->string('method', 50)->default('code')->comment('Supported values: code, automatic');
            $table->string('title', 255);
            $table->string('code', 100)->nullable();

            $table->string('discount_type', 50)->default('amount-off')->comment('Supported values: amount-off, free-shipping, buy-x-get-y');
            $table->string('discount_target', 50)->nullable()->comment('Supported values: order, products');
            $table->string('discount_value_type', 50)->nullable()->comment('Supported values: percentage, fixed');
            $table->integer('base_discount_amount_fixed')->nullable();
            $table->float('discount_amount_percentage')->nullable();

            $table->string('eligible_item_type', 50)->nullable()->comment('Supported values: specific-products, specific-categories, all-products');
            $table->string('spend_condition_type', 50)->nullable()->comment('Supported values: min-cart-amount, min-items');
            $table->integer('spend_condition_value')->nullable();
            $table->integer('reward_quantity')->nullable();
            $table->integer('reward_value')->nullable();

            $table->datetime('start_datetime')->nullable();
            $table->boolean('has_end_datetime')->default(0);
            $table->datetime('end_datetime')->nullable();

            $table->string('target_country_type', 50)->default('all-countries')->comment('Supported values: all-countries, specific-countries');
            $table->text('target_countries')->nullable()->comment('Array of {country, states} regions as JSON');
            $table->boolean('first_time_buyer_only')->default(0);
            $table->string('customer_include_eligibility', 50)->default('everyone')->comment('Supported values: everyone, customers, guests, specific-customers, specific-groups');
            $table->string('customer_exclude_eligibility', 50)->default('none')->comment('Supported values: none, customers, guests, specific-customers, specific-groups');

            $table->boolean('has_usage_limit')->default(0);
            $table->integer('usage_limit')->nullable();
            $table->boolean('has_customer_limit')->default(0);
            $table->integer('customer_limit')->nullable();

            $table->integer('current_usage_count')->default(0);
            $table->boolean('is_active')->default(1);
            $table->text('combinations')->nullable()->comment('Array of combinations as JSON');
            $table->unsigned_big_integer('created_by')->nullable();
            $table->unsigned_big_integer('updated_by')->nullable();
            $table->timestamps();

            $table->unique('code', 'uq_kecom_coupons_code');
            $table->foreign('created_by', 'fk_kecom_coupons_created_by')->on('users')->references('ID')->null_on_delete();
            $table->foreign('updated_by', 'fk_kecom_coupons_updated_by')->on('users')->references('ID')->null_on_delete();

            $table->index(['is_active', 'start_datetime', 'has_end_datetime', 'end_datetime'], 'idx_kecom_coupons_active_window');
        });
    }

    /**
     * Drop the kirki_ecommerce_coupons table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_coupons');
    }
}
