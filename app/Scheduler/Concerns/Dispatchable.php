<?php

namespace Kirki\Ecommerce\App\Scheduler\Concerns;

use Kirki\Ecommerce\App\Scheduler\Constants\JobStatus;
use Kirki\Ecommerce\App\Scheduler\DeferredDispatcher;
use Kirki\Ecommerce\App\Scheduler\Repositories\QueueRepository;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

trait Dispatchable
{
    /**
     * Dispatch the job with the given arguments.
     *
     * @param mixed $values
     * @return DeferredDispatcher
     */
    public static function dispatch($values = [])
    {
        $values = is_array($values) ? $values : func_get_args();

        return static::new_deferred_dispatcher($values);
    }

    /**
     * Get the queue repository instance.
     *
     * @return QueueRepository
     */
    public function queue_repository()
    {
        return new QueueRepository();
    }

    /**
     * Create a new deferred dispatcher instance.
     *
     * @param array $values
     * @return DeferredDispatcher
     */
    protected static function new_deferred_dispatcher(array $values)
    {
        $job = new static();
        $job->args($values);

        return new DeferredDispatcher($job);
    }

    /**
     * Store the job into the storage via the queue repository.
     *
     * @return void
     */
    public function store()
    {
        $repository = $this->queue_repository();
        $scheduled_at = $this->get_delay() ?? Date::now();

        $repository->create([
            'resolver' => $this->get_resolver(),
            'status' => JobStatus::PENDING,
            'args' => Arr::json_encode($this->get_args()),
            'priority' => $this->get_priority(),
            'scheduled_at' => $scheduled_at->to_sql_datetime_string(),
        ]);
    }
}
