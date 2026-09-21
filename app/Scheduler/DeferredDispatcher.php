<?php

namespace Kirki\Ecommerce\App\Scheduler;

/**
 * Fluent wrapper that configures a job and stores it when the wrapper is destroyed.
 *
 * @since 1.0.0
 */
class DeferredDispatcher
{
    /**
     * The job instance that is being deferred for dispatching.
     *
     * @var mixed
     */
    protected $job;

    /**
     * Initialize the dispatcher with a specific job instance.
     *
     * @since 1.0.0
     *
     * @param mixed $job Job instance using the Queueable trait.
     */
    public function __construct($job)
    {
        $this->job = $job;
    }

    /**
     * Specify the delay (time or interval) before the job should be executed.
     *
     * @since 1.0.0
     *
     * @param mixed $moment The moment at which the job becomes due.
     * @return $this
     */
    public function delay($moment)
    {
        $this->job->delay($moment);

        return $this;
    }

    /**
     * Set the execution priority level for the job.
     *
     * @since 1.0.0
     *
     * @param int $priority Lower numbers run first.
     * @return $this
     */
    public function priority(int $priority)
    {
        $this->job->priority($priority);

        return $this;
    }

    /**
     * Ensure the job is executed without any scheduled delay.
     *
     * @since 1.0.0
     *
     * @return $this
     */
    public function without_delay()
    {
        $this->job->delay(null);

        return $this;
    }

    /**
     * Proxy method calls to the underlying job instance to allow fluent configuration.
     *
     * @since 1.0.0
     *
     * @param string $method     Method name to call on the job.
     * @param array  $parameters Arguments passed to the job method.
     * @return $this
     */
    public function __call($method, $parameters)
    {
        $this->job->$method(...$parameters);

        return $this;
    }

    /**
     * Store the job in the queue and, when it has no delay, trigger the async worker immediately.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function __destruct()
    {
        $this->job->store();

        // If no delay then trigger the job immediately using async worker.
        if ($this->job->get_delay() === null) {
            $this->job->trigger_async_worker();
        }
    }
}
