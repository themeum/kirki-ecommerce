<?php

namespace Kirki\Ecommerce\App\Scheduler\Concerns;

use Kirki\Ecommerce\App\Scheduler\Constants\Config;

trait Queueable
{
    use Dispatchable, HasAsyncWorker;

    /**
     * The arguments that will be passed to the job's handle method.
     *
     * @var array
     */
    protected $args = [];

    /**
     * The priority of the job. Lower numbers indicate higher priority.
     *
     * @var int
     */
    protected $priority = 10;

    /**
     * The delay in seconds before the job should be processed.
     *
     * @var int|null
     */
    protected $delay = null;

    /**
     * The number of times the job should be retried on failure.
     *
     * @var int
     */
    protected $retry = Config::MAX_RETRIES;

    /**
     * The number of jobs to process in a single batch.
     *
     * @var int
     */
    protected $batch = Config::DEFAULT_BATCH_SIZE;

    /**
     * Get the class name of the job resolver.
     *
     * @return string
     */
    public function get_resolver()
    {
        return get_class($this);
    }

    /**
     * Set the arguments for the job.
     *
     * @param array|mixed $values
     * @return $this
     */
    public function args($values = [])
    {
        $values = is_array($values) ? $values : func_get_args();
        $this->args = $values;

        return $this;
    }

    /**
     * Get the arguments assigned to the job.
     *
     * @return array
     */
    public function get_args()
    {
        return $this->args;
    }

    /**
     * Set the job priority.
     *
     * @param int $priority
     * @return $this
     */
    public function priority(int $priority)
    {
        $this->priority = $priority;

        return $this;
    }

    /**
     * Get the job priority, clamped between 0 and 255.
     *
     * @return int
     */
    public function get_priority()
    {
        return max(0, min($this->priority, 255));
    }

    /**
     * Set the delay for the job execution.
     *
     * @param int|null $moment
     * @return $this
     */
    public function delay($moment = null)
    {
        $this->delay = $moment;

        return $this;
    }

    /**
     * Get the delay before the job is executed.
     *
     * @return int|null
     */
    public function get_delay()
    {
        return $this->delay;
    }

    /**
     * Set the number of items per batch.
     *
     * @param int $size
     * @return $this
     */
    public function batch(int $size)
    {
        $this->batch = $size;

        return $this;
    }

    /**
     * Get the batch size.
     *
     * @return int
     */
    public function get_batch()
    {
        return $this->batch;
    }

    /**
     * Set the number of times the job should be retried on failure.
     *
     * @param int $attempts
     * @return $this
     */
    public function retry(int $attempts)
    {
        $this->retry = $attempts;

        return $this;
    }

    /**
     * Get the number of times the job should be retried on failure.
     *
     * @return int
     */
    public function get_retry()
    {
        return intval($this->retry ?? 0);
    }
}
