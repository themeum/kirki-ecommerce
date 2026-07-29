<?php

namespace Kirki\Ecommerce\App\Scheduler\Constants;

final class Config
{
    /**
     * The name of the action to trigger the async worker.
     */
    public const ASYNC_WORKER_ACTION_NAME = 'async_worker';

    /**
     * The name of the secret key for the async worker.
     */
    public const ASYNC_WORKER_SECRET_KEY_NAME = 'async_worker_secret_key';

    /**
     * The name of the cron event for the scheduler.
     */
    public const SCHEDULER_CRON_EVENT_NAME = 'kirki_ecommerce_scheduler_cron_event';

    /**
     * The name of the cron event for the cleanup.
     */
    public const SCHEDULER_CRON_CLEANUP_EVENT_NAME = 'kirki_ecommerce_scheduler_cleanup_event';

    /**
     * The maximum number of retries for a job.
     */
    public const MAX_RETRIES = 3;

    /**
     * The default batch size for processing jobs.
     */
    public const DEFAULT_BATCH_SIZE = 25;

    /**
     * The gap between job executions in microseconds.
     * total: 0.05s
     */
    public const JOB_EXECUTION_GAP_IN_MICROSECOND = 50000;

    /**
     * The interval for the cron event.
     */
    public const CRON_EVENT_INTERVAL = 'every_minute';
}
