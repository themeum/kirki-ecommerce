<?php

namespace Kirki\Ecommerce\Scheduler\Constants;

class JobStatus
{
    /**
     * The job is pending execution.
     */
    public const PENDING = 'pending';

    /**
     * The job is currently being processed.
     */
    public const PROCESSING = 'processing';

    /**
     * The job has failed to complete.
     */
    public const FAILED = 'failed';

    /**
     * The job has completed successfully.
     */
    public const COMPLETED = 'completed';
}
