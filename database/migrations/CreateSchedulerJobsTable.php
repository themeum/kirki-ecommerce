<?php

namespace Kirki\Ecommerce\Database\Migrations;

use Kirki\Ecommerce\Framework\Contracts\Migration;
use Kirki\Ecommerce\Framework\Database\Schema\Structure;
use Kirki\Ecommerce\Framework\Supports\Facades\Schema;

class CreateSchedulerJobsTable implements Migration
{
    public function up()
    {
        Schema::create('kirki_ecommerce_scheduler_jobs', function (Structure $table) {
            $table->id();
            $table->string('resolver', 200);
            $table->long_text('args')->nullable();
            $table->enum('status', ['pending', 'processing', 'failed', 'completed'])->default('pending');
            $table->integer('priority')->default(10);
            $table->datetime('scheduled_at');
            $table->string('claim_id', 64)->nullable();
            $table->integer('attempts')->default(0);
            $table->timestamps();

            $table->index('status', 'idx_queue_status');
            $table->index('scheduled_at', 'idx_queue_scheduled_at');
            $table->index('claim_id', 'idx_queue_claim_id');
        });
    }

    public function down()
    {
        Schema::drop_if_exists('kirki_ecommerce_scheduler_jobs');
    }
}
