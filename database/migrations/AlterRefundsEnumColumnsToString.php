<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterRefundsEnumColumnsToString implements Migration
{
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

    public function down()
    {
        Schema::table('kirki_ecommerce_refunds', function (Structure $table) {
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending')->change();
            $table->enum('refund_type', ['partial', 'full'])->default('partial')->change();
        });
    }
}
