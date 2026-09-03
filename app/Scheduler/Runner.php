<?php

namespace Kirki\Ecommerce\App\Scheduler;

use Kirki\Ecommerce\App\Scheduler\Concerns\HasAsyncWorker;
use Kirki\Ecommerce\App\Scheduler\Constants\Config;
use Kirki\Ecommerce\App\Scheduler\Constants\JobStatus;
use Kirki\Ecommerce\App\Scheduler\DTO\JobDTO;
use Kirki\Ecommerce\App\Scheduler\Repositories\QueueRepository;
use Exception;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\uuid;

class Runner
{
    use HasAsyncWorker;

    protected $repository;

    public function __construct(QueueRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Executes the scheduler runner.
     * 
     * This method manages the lifecycle of job processing. It first resets stuck jobs 
     * that have exceeded the timeout, then claims a batch of jobs for the current 
     * execution cycle. Each job is resolved sequentially with a configurable delay. 
     * Finally, it triggers an asynchronous worker if more pending jobs remain.
     *
     * @return void
     */
    public function run()
    {
        $this->repository->reset_stuck_jobs(5 * MINUTE_IN_SECONDS, Config::MAX_RETRIES);

        $claim_id = uuid();
        $locked_job_count = $this->repository->lock_jobs($claim_id, Config::DEFAULT_BATCH_SIZE);

        if ($locked_job_count === 0) {
            return;
        }

        $jobs = $this->repository->get_claimed_jobs($claim_id);

        foreach ($jobs as $job) {
            $this->resolve($this->create_job_dto($job), $this->repository);
            usleep(Config::JOB_EXECUTION_GAP_IN_MICROSECOND);
        }

        if ($this->repository->has_pending_jobs()) {
            $this->trigger_async_worker();
        }
    }

    /**
     * Creates a Job Data Transfer Object (DTO) from a raw job record.
     * 
     * Validates the raw job object and converts it into a structured JobDTO 
     * instance. It also handles decoding the JSON-encoded arguments for the job.
     *
     * @param object $job The raw job record from the database.
     * @return JobDTO
     * @throws Exception If validation of the job data fails.
     */
    protected function create_job_dto($job)
    {
        $this->validate($job);
        $args = !empty($job->args) ? json_decode($job->args, true) : [];

        return JobDTO::from_array([
            'id' => $job->id,
            'resolver' => $job->resolver,
            'args' => $args,
        ]);
    }

    /**
     * Validates the integrity of the job record.
     * 
     * Ensures that the job object is not empty and that a resolver class 
     * has been specified for processing the job.
     *
     * @param object|null $job The raw job record to validate.
     * @throws Exception If the job is invalid or missing a resolver class.
     * @return void
     */
    protected function validate($job)
    {
        if (empty($job)) {
            throw new Exception(__("Invalid job provided to resolve", 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        if (empty($job->resolver)) {
            throw new Exception(__("Missing resolver class", 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }
    }

    /**
     * Resolves and executes the business logic for a specific job.
     * 
     * This method instantiates the resolver class, executes its handle method, 
     * and marks the job as completed in the database. If an error occurs, 
     * it marks the job as failed and logs the error.
     *
     * @param JobDTO $job The job data transfer object.
     * @param QueueRepository $repository The queue repository for status updates.
     * @return void
     */
    protected function resolve(JobDTO $job, QueueRepository $repository)
    {
        try {
            $resolver = $this->make_resolver($job->resolver);
            $resolver->handle($job->args);
            $repository->mark_as_completed($job->id);
        } catch (Exception $error) {
            $repository->mark_as_failed($job->id, isset($resolver) ? $resolver->get_retry() : 0);
            error_log(
                sprintf(
                    "Failed to resolve job [%s] with error: %s",
                    $job->id,
                    $error->getMessage()
                )
            );
        }
    }

    /**
     * Instantiates a resolver class instance from the service container.
     * 
     * Checks if the resolver class exists and if it implements the required 
     * handle method before attempting to create the instance.
     *
     * @param string $resolver The fully qualified class name of the resolver.
     * @return object The instantiated resolver.
     * @throws Exception If the class is missing or does not have a handle method.
     */
    protected function make_resolver(string $resolver)
    {
        if (!class_exists($resolver)) {
            /* translators: %s: job resolver class name */
            throw new Exception(sprintf(__('Class [%s] missing to resolve the job', 'kirki-ecommerce'), $resolver)); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        if (!method_exists($resolver, 'handle')) {
            /* translators: %s: job resolver class name */
            throw new Exception(sprintf(__('Missing [%s::handle] method to resolve the job', 'kirki-ecommerce'), $resolver)); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return app()->make($resolver);
    }

    /**
     * Cleanup jobs that have been completed or failed for a specific status.
     *
     * @param string $status
     * @param int $days
     * @return bool
     */
    public function cleanup(string $status, int $days = 7)
    {
        return $this->repository->cleanup($status, $days);
    }

    /**
     * Cleanup failed jobs from the scheduler repository.
     * 
     * This method identifies and removes job records that have reached a failed 
     * status and have exceeded the retention period of 15 days. This process 
     * ensures that the scheduler table does not grow indefinitely with 
     * unsuccessful job entries, maintaining optimal database performance.
     *
     * @return bool Returns true if the cleanup operation was successful.
     */
    public function clean_failed_jobs()
    {
        return $this->cleanup(JobStatus::FAILED, 15);
    }

    /**
     * Cleanup completed jobs from the scheduler repository.
     * 
     * This method identifies and removes job records that have been successfully 
     * processed and have exceeded the retention period of 7 days. Regularly 
     * clearing completed records helps maintain a lean database table and 
     * improves query performance for pending tasks.
     *
     * @return bool Returns true if the cleanup operation was successful.
     */
    public function clean_completed_jobs()
    {
        return $this->cleanup(JobStatus::COMPLETED, 7);
    }
}
