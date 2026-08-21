<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class AlterSchedulerJobsStatusColumnToString implements Migration
{
    public function up()
    {
        Schema::table('kirki_ecommerce_scheduler_jobs', function (Structure $table) {
            $table->string('status', 50)
                ->default('pending')
                ->comment('Supported values: pending, processing, failed, completed')
                ->change();
        });
    }

    public function down()
    {
        Schema::table('kirki_ecommerce_scheduler_jobs', function (Structure $table) {
            $table->enum('status', ['pending', 'processing', 'failed', 'completed'])->default('pending')->change();
        });
    }
}
