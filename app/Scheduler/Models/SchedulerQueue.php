<?php

namespace Kirki\Ecommerce\App\Scheduler\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class SchedulerQueue extends Model
{
    protected $table = 'kirki_ecommerce_scheduler_jobs';
    protected $primary_key = 'id';

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
