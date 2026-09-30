<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Drops the kirki_ecommerce_scheduler_jobs table, left unused since the framework queue replaced the in-house scheduler.
 *
 * @since 1.0.0
 */
class DropSchedulerJobsTable implements Migration
{
    /**
     * Drop the kirki_ecommerce_scheduler_jobs table if it exists.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::drop_if_exists('kirki_ecommerce_scheduler_jobs');
    }

    /**
     * Nothing to do
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        // no rollback
    }
}
