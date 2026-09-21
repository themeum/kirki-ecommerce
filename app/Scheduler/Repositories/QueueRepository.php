<?php

namespace Kirki\Ecommerce\App\Scheduler\Repositories;

use Kirki\Ecommerce\App\Scheduler\Constants\JobStatus;
use Kirki\Ecommerce\App\Scheduler\Models\SchedulerQueue;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

/**
 * Reads and updates the scheduler jobs table: claiming, status changes and cleanup.
 *
 * @since 1.0.0
 */
class QueueRepository
{
    /**
     * Create a new job in the queue.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Column values for the new job row.
     * @return SchedulerQueue
     */
    public function create(array $data)
    {
        return SchedulerQueue::create($data);
    }

    /**
     * Get the jobs claimed with the given claim ID, ordered by priority.
     *
     * @since 1.0.0
     *
     * @param string $claim_id
     * @return \Kirki\Ecommerce\Framework\Collections\Collection
     */
    public function get_claimed_jobs(string $claim_id)
    {
        return SchedulerQueue::where('claim_id', $claim_id)
            ->order_by('priority', 'asc')
            ->get();
    }

    /**
     * Claim due pending jobs for the given claim ID and mark them as processing.
     *
     * @since 1.0.0
     *
     * @param string $claim_id Unique ID identifying this run.
     * @param int    $batch    Maximum number of jobs to claim.
     * @return int Number of jobs claimed.
     */
    public function lock_jobs(string $claim_id, int $batch)
    {
        $now = Date::now();

        return SchedulerQueue::where('status', JobStatus::PENDING)
            ->where('scheduled_at', '<=', $now->to_sql_datetime_string())
            ->where_null('claim_id')
            ->limit($batch)
            ->order_by('priority', 'asc')
            ->update([
                'claim_id' => $claim_id,
                'status' => JobStatus::PROCESSING,
            ]);
    }

    /**
     * Set the status of a job and release its claim.
     *
     * @since 1.0.0
     *
     * @param int    $id     Job ID.
     * @param string $status New status.
     * @return int Number of rows updated.
     */
    protected function update_status(int $id, string $status)
    {
        return SchedulerQueue::where('id', $id)->update([
            'status' => $status,
            'claim_id' => null,
        ]);
    }

    /**
     * Mark a job as completed.
     *
     * @since 1.0.0
     *
     * @param int $id Job ID.
     * @return int Number of rows updated.
     */
    public function mark_as_completed(int $id)
    {
        return $this->update_status($id, JobStatus::COMPLETED);
    }

    /**
     * Handle a failed job execution by requeueing it or marking it as failed.
     *
     * While the attempt count is below `$retry` the job goes back to pending with the count
     * incremented; otherwise it is marked failed. A `$retry` of 0 fails it immediately.
     *
     * @since 1.0.0
     *
     * @param int $id    Job ID.
     * @param int $retry Maximum number of retries allowed for the job.
     * @return int|null Rows updated when the job is marked failed; null when the job is missing or requeued.
     */
    public function mark_as_failed(int $id, int $retry = 3)
    {
        $job = SchedulerQueue::where('id', $id)->first();

        if (empty($job)) {
            return;
        }

        if ($retry === 0) {
            return $this->update_status($id, JobStatus::FAILED);
        }

        if ($job->attempts < $retry) {
            $job->update([
                'status' => JobStatus::PENDING,
                'attempts' => $job->attempts + 1,
                'claim_id' => null,
            ]);

            return;
        }

        return $this->update_status($id, JobStatus::FAILED);
    }

    /**
     * Requeue or fail jobs that have been in processing status for longer than the timeout.
     *
     * Jobs with fewer than `$max_retries` attempts go back to pending with the count incremented;
     * the rest are marked failed.
     *
     * @since 1.0.0
     *
     * @param int $timeout     Seconds a job may stay in processing status.
     * @param int $max_retries Maximum number of attempts before a job is failed.
     * @return int Number of rows updated.
     */
    public function reset_stuck_jobs(int $timeout, int $max_retries = 3)
    {
        $cutoff = Date::now()->sub_seconds($timeout);

        return SchedulerQueue::where('status', JobStatus::PROCESSING)
            ->where('updated_at', '<=', $cutoff->to_sql_datetime_string())
            ->update([
                'status' => DB::raw(
                    sprintf(
                        "CASE WHEN attempts < %d THEN '%s' ELSE '%s' END",
                        $max_retries,
                        JobStatus::PENDING,
                        JobStatus::FAILED
                    )
                ),
                'claim_id' => null,
                'attempts' => DB::raw(
                    sprintf(
                        "CASE WHEN attempts < %d THEN attempts + 1 ELSE attempts END",
                        $max_retries
                    )
                ),
            ]);
    }

    /**
     * Determine whether any pending jobs are due to be processed.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function has_pending_jobs()
    {
        $now = Date::now();

        return SchedulerQueue::where('status', JobStatus::PENDING)
            ->where('scheduled_at', '<=', $now->to_sql_datetime_string())
            ->count() > 0;
    }

    /**
     * Delete jobs with the given status that were scheduled at least the given number of days ago.
     *
     * Deletes in chunks of 1000 IDs with a short sleep between chunks to reduce database load.
     *
     * @since 1.0.0
     *
     * @param string $status Job status to delete.
     * @param int    $days   Minimum age in days.
     * @return bool
     */
    public function cleanup($status, $days)
    {
        $cutoff = Date::now()->sub_days($days);

        return SchedulerQueue::where('status', $status)
            ->where('scheduled_at', '<=', $cutoff->to_sql_datetime_string())
            ->chunk_by_id(1000, function ($jobs) {
                $ids = $jobs->pluck('id')->to_array();
                SchedulerQueue::where_in('id', $ids)->delete();
                usleep(200000); // sleep for 200ms to reduce the DB pressure
            });
    }
}
