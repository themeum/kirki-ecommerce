<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

/**
 * Creates the kirki_ecommerce_failed_jobs table, which keeps queue jobs that ran out of attempts.
 *
 * @since 1.0.0
 */
class CreateFailedJobsTable implements Migration
{
    /**
     * Create the kirki_ecommerce_failed_jobs table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kirki_ecommerce_failed_jobs', function (Structure $table) {
            $table->id();
            $table->string('uuid', 36);
            $table->string('queue', 191);
            $table->long_text('payload');
            $table->long_text('exception');
            $table->unsigned_integer('failed_at');

            $table->unique('uuid', 'uq_kirki_ecommerce_failed_jobs_uuid');
        });
    }

    /**
     * Drop the kirki_ecommerce_failed_jobs table.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_failed_jobs');
    }
}
