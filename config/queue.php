<?php

/**
 * Queue configuration.
 *
 * Every key is optional. The framework resolves the same defaults shown here
 * when a key is absent, and the queue works correctly with this file deleted,
 * so it exists to document and override them.
 *
 * The queue itself is off until Framework\Queue\QueueServiceProvider is listed
 * in bootstrap/providers.php.
 */

return [
    /*
     * How many jobs one claim reserves. A worker keeps claiming batches while
     * its time budget lasts, so this bounds a single claim, not a request.
     */
    'batch_size' => 10,

    /*
     * The most seconds a background worker spends starting jobs before it
     * hands over to a fresh request. The effective budget is the smaller of
     * this and 80% of max_execution_time. A job already running is never cut
     * short; keep individual jobs well under this.
     */
    'time_limit' => 20,

    /*
     * Seconds after which a reserved job whose worker vanished (a fatal error,
     * a killed process) is considered abandoned and may be claimed again.
     * Must be longer than your slowest job, or that job can run twice.
     */
    'retry_after' => 300,

    /*
     * Default number of attempts for a job that does not declare $tries.
     */
    'tries' => 1,

    /*
     * Default seconds to wait before retrying a failed attempt, for a job that
     * does not declare $backoff. An array gives one delay per attempt, with the
     * last value reused: [10, 60, 300].
     */
    'backoff' => 0,
];
