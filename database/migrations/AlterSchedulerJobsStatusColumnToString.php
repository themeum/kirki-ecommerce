<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Converts the status column of the scheduler jobs table from an enum to a string.
 *
 * @since 1.0.0
 */
class AlterSchedulerJobsStatusColumnToString implements Migration
{
    /**
     * Convert the status column of the scheduler jobs table from an enum to a string.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::table('kirki_ecommerce_scheduler_jobs', function (Structure $table) {
            $table->string('status', 50)
                ->default('pending')
                ->comment('Supported values: pending, processing, failed, completed')
                ->change();
        });
    }

    /**
     * Convert the status column of the scheduler jobs table back to an enum.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::table('kirki_ecommerce_scheduler_jobs', function (Structure $table) {
            $table->enum('status', ['pending', 'processing', 'failed', 'completed'])->default('pending')->change();
        });
    }
}
