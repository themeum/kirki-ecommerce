<?php

namespace Kirki\Ecommerce\App\Scheduler;

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
     * @param mixed $job
     */
    public function __construct($job)
    {
        $this->job = $job;
    }

    /**
     * Specify the delay (time or interval) before the job should be executed.
     *
     * @param mixed $moment
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
     * @param int $priority
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
     * @param string $method
     * @param array $parameters
     * @return $this
     */
    public function __call($method, $parameters)
    {
        $this->job->$method(...$parameters);

        return $this;
    }

    /**
     * Finalize the job by storing it in the database and triggering it immediately 
     * via an async worker if no delay is specified.
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
