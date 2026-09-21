<?php

namespace Kirki\Ecommerce\App\Scheduler\Concerns;

use Kirki\Ecommerce\App\Scheduler\Constants\Config;

/**
 * Adds the queue settings (arguments, priority, delay, retries, batch size) to a scheduler job.
 *
 * @since 1.0.0
 */
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
     * The moment at which the job becomes due, or null to run it immediately.
     *
     * @var mixed
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
     * @since 1.0.0
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
     * @since 1.0.0
     *
     * @param array|mixed $values Arguments for the job's handle method; a non-array value falls back to all passed arguments.
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
     * @since 1.0.0
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
     * @since 1.0.0
     *
     * @param int $priority Lower numbers run first.
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
     * @since 1.0.0
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
     * @since 1.0.0
     *
     * @param mixed $moment The moment at which the job becomes due, or null to run it immediately.
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
     * @since 1.0.0
     *
     * @return mixed Null when the job has no delay.
     */
    public function get_delay()
    {
        return $this->delay;
    }

    /**
     * Set the number of items per batch.
     *
     * @since 1.0.0
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
     * @since 1.0.0
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
     * @since 1.0.0
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
     * @since 1.0.0
     *
     * @return int
     */
    public function get_retry()
    {
        return intval($this->retry ?? 0);
    }
}
