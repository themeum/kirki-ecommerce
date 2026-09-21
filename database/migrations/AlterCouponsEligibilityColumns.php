<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Replaces the coupon customer eligibility columns with include and exclude eligibility and adds a target country type.
 *
 * @since 1.0.0
 */
class AlterCouponsEligibilityColumns implements Migration
{
    /**
     * Add the country and include/exclude eligibility columns to the coupons table and drop the old customer eligibility columns.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_coupons', function (Structure $table) {
            $table->string('target_country_type', 50)
                ->default('all-countries')
                ->comment('Supported values: all-countries, specific-countries')
                ->after('end_datetime');

            $table->text('target_countries')
                ->nullable()
                ->comment('Array of {country, states} regions as JSON')
                ->change();

            $table->drop_column(['customer_eligibility', 'exclude_customers']);

            $table->string('customer_include_eligibility', 50)
                ->default('everyone')
                ->comment('Supported values: everyone, customers, guests, specific-customers, specific-groups')
                ->after('first_time_buyer_only');

            $table->string('customer_exclude_eligibility', 50)
                ->default('none')
                ->comment('Supported values: none, customers, guests, specific-customers, specific-groups')
                ->after('customer_include_eligibility');
        });
    }

    /**
     * Drop the country and include/exclude eligibility columns from the coupons table and restore the old customer eligibility columns.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_coupons', function (Structure $table) {
            $table->drop_column(['target_country_type', 'customer_include_eligibility', 'customer_exclude_eligibility']);

            $table->text('target_countries')
                ->nullable()
                ->comment('Array of country codes as JSON')
                ->change();

            $table->enum('customer_eligibility', ['all', 'specific-customers', 'specific-groups'])
                ->default('all')
                ->after('first_time_buyer_only');

            $table->boolean('exclude_customers')
                ->default(0)
                ->after('customer_eligibility');
        });
    }
}
