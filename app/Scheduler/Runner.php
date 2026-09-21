<?php

namespace Kirki\Ecommerce\App\Scheduler;

use Kirki\Ecommerce\App\Scheduler\Concerns\HasAsyncWorker;
use Kirki\Ecommerce\App\Scheduler\Constants\Config;
use Kirki\Ecommerce\App\Scheduler\Constants\JobStatus;
use Kirki\Ecommerce\App\Scheduler\DTO\JobDTO;
use Kirki\Ecommerce\App\Scheduler\Repositories\QueueRepository;
use Exception;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\uuid;

/**
 * Claims due queue jobs, runs their resolvers and cleans up old job records.
 *
 * @since 1.0.0
 */
class Runner
{
    use HasAsyncWorker;

    /** @var QueueRepository */
    protected $repository;

    /**
     * Create the runner with the queue repository it operates on.
     *
     * @since 1.0.0
     *
     * @param QueueRepository $repository
     */
    public function __construct(QueueRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Process one batch of queued jobs.
     *
     * Resets stuck jobs, claims a batch of due jobs and resolves them one by one with a short gap
     * between each. Triggers the async worker again when more pending jobs remain.
     *
     * @since 1.0.0
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
     * Create a JobDTO from a raw job record, decoding its JSON arguments.
     *
     * @since 1.0.0
     *
     * @param object $job Raw job record from the database.
     * @return JobDTO
     * @throws Exception When the job is empty or has no resolver.
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
     * Ensure the job record is not empty and names a resolver class.
     *
     * @since 1.0.0
     *
     * @param object|null $job Raw job record to validate.
     * @return void
     * @throws Exception When the job is empty or has no resolver.
     */
    protected function validate($job)
    {
        throw_if(empty($job), __("Invalid job provided to resolve", 'kirki-ecommerce'));

        throw_if(empty($job->resolver), __("Missing resolver class", 'kirki-ecommerce'));
    }

    /**
     * Run the job's resolver and record the outcome.
     *
     * Marks the job completed on success. On an exception it marks the job failed (subject to its
     * retry setting) and writes the error to the PHP error log.
     *
     * @since 1.0.0
     *
     * @param JobDTO          $job        Job to run.
     * @param QueueRepository $repository Repository used to update the job status.
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
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Genuine job-failure error, not debug output; writes to the server's PHP error log rather than this plugin's own framework.log, which is not protected from direct web access.
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
     * Instantiate the resolver class from the service container.
     *
     * @since 1.0.0
     *
     * @param string $resolver Fully qualified class name of the resolver.
     * @return object
     * @throws Exception When the class does not exist or has no handle method.
     */
    protected function make_resolver(string $resolver)
    {
        /* translators: %s: job resolver class name */
        throw_if(!class_exists($resolver), sprintf(__('Class [%s] missing to resolve the job', 'kirki-ecommerce'), $resolver));

        /* translators: %s: job resolver class name */
        throw_if(!method_exists($resolver, 'handle'), sprintf(__('Missing [%s::handle] method to resolve the job', 'kirki-ecommerce'), $resolver));

        return app()->make($resolver);
    }

    /**
     * Delete jobs with the given status that were scheduled at least the given number of days ago.
     *
     * @since 1.0.0
     *
     * @param string $status Job status to delete.
     * @param int    $days   Minimum age in days.
     * @return bool
     */
    public function cleanup(string $status, int $days = 7)
    {
        return $this->repository->cleanup($status, $days);
    }

    /**
     * Delete failed jobs that were scheduled at least 15 days ago.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function clean_failed_jobs()
    {
        return $this->cleanup(JobStatus::FAILED, 15);
    }

    /**
     * Delete completed jobs that were scheduled at least 7 days ago.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function clean_completed_jobs()
    {
        return $this->cleanup(JobStatus::COMPLETED, 7);
    }
}
