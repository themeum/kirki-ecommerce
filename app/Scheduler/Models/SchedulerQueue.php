<?php

namespace Kirki\Ecommerce\App\Scheduler\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a job row in the scheduler jobs table.
 *
 * @since 1.0.0
 */
class SchedulerQueue extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_scheduler_jobs';
    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $fillable = [
        'resolver',
        'args',
        'status',
        'priority',
        'scheduled_at',
        'claim_id',
        'attempts',
        'created_at',
        'updated_at',
    ];
}
