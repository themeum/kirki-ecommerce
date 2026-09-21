<?php

namespace Kirki\Ecommerce\App\Scheduler\Concerns;

use Kirki\Ecommerce\App\Scheduler\Constants\JobStatus;
use Kirki\Ecommerce\App\Scheduler\DeferredDispatcher;
use Kirki\Ecommerce\App\Scheduler\Repositories\QueueRepository;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

/**
 * Adds static dispatching and database storage to a queueable job.
 *
 * @since 1.0.0
 */
trait Dispatchable
{
    /**
     * Dispatch the job with the given arguments.
     *
     * The returned dispatcher stores the job when it is destroyed.
     *
     * @since 1.0.0
     *
     * @param mixed $values Arguments for the job's handle method; a non-array value falls back to all passed arguments.
     * @return DeferredDispatcher
     */
    public static function dispatch($values = [])
    {
        $values = is_array($values) ? $values : func_get_args();

        return static::new_deferred_dispatcher($values);
    }

    /**
     * Get a queue repository instance.
     *
     * @since 1.0.0
     *
     * @return QueueRepository
     */
    public function queue_repository()
    {
        return new QueueRepository();
    }

    /**
     * Create a job instance with the given arguments wrapped in a deferred dispatcher.
     *
     * @since 1.0.0
     *
     * @param array $values Arguments for the job's handle method.
     * @return DeferredDispatcher
     */
    protected static function new_deferred_dispatcher(array $values)
    {
        $job = new static();
        $job->args($values);

        return new DeferredDispatcher($job);
    }

    /**
     * Store the job as a pending row in the scheduler queue table.
     *
     * @since 1.0.0
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
