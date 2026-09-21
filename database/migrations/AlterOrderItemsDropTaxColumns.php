<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Drops the tax rate and breakdown columns from the order items table.
 *
 * @since 1.0.0
 */
class AlterOrderItemsDropTaxColumns implements Migration
{
    /**
     * Drop the tax_rate and tax_breakdown columns from the order items table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_order_items', function (Structure $table) {
            $table->drop_column(['tax_rate', 'tax_breakdown']);
        });
    }

    /**
     * Re-add the tax_rate and tax_breakdown columns to the order items table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_order_items', function (Structure $table) {
            $table->decimal('tax_rate', 8, 4)
                ->nullable()
                ->comment('Tax rate as a percentage')
                ->after('product_image');

            $table->text('tax_breakdown')
                ->nullable()
                ->comment('JSON snapshot of tax breakdown')
                ->after('base_tax_total');
        });
    }
}
