<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Converts the status and refund type columns of the refunds table from enums to strings.
 *
 * @since 1.0.0
 */
class AlterRefundsEnumColumnsToString implements Migration
{
    /**
     * Convert the status and refund_type columns of the refunds table from enums to strings.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_refunds', function (Structure $table) {
            $table->string('status', 50)
                ->default('pending')
                ->comment('Supported values: pending, completed, failed, cancelled')
                ->change();

            $table->string('refund_type', 50)
                ->default('partial')
                ->comment('Supported values: partial, full')
                ->change();
        });
    }

    /**
     * Convert the status and refund_type columns of the refunds table back to enums.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_refunds', function (Structure $table) {
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending')->change();
            $table->enum('refund_type', ['partial', 'full'])->default('partial')->change();
        });
    }
}
