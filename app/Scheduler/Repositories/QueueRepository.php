<?php

namespace Kirki\Ecommerce\App\Scheduler\Repositories;

use Kirki\Ecommerce\App\Scheduler\Constants\JobStatus;
use Kirki\Ecommerce\App\Scheduler\Models\SchedulerQueue;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

class QueueRepository
{
    /**
     * Create a new job in the queue.
     *
     * @param array $data
     * @return SchedulerQueue
     */
    public function create(array $data)
    {
        return SchedulerQueue::create($data);
    }

    /**
     * Get jobs associated with a specific claim ID.
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
     * Lock pending jobs for a specific claim ID.
     *
     * @param string $claim_id
     * @param int $batch
     * @return int
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
     * Update the status of a specific job.
     *
     * @param int $id
     * @param string $status
     * @return int
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
     * @param int $id
     * @return int
     */
    public function mark_as_completed(int $id)
    {
        return $this->update_status($id, JobStatus::COMPLETED);
    }

    /**
     * Mark a job as failed and handle retry logic.
     *
     * @param int $id
     * @param int $retry
     * @return int|void
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
     * Reset jobs that have been stuck in processing status.
     *
     * @param int $timeout
     * @param int $max_retries
     * @return int
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
     * Check if there are any pending jobs ready to be processed.
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
     * Cleanup jobs that have been completed or failed for a specific status.
     *
     * This method chunks the jobs by ID to reduce the load on the database 
     * and deletes them in batches. It also includes a sleep delay to prevent 
     * overwhelming the database with too many queries.
     *
     * @param string $status
     * @param int $days
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
