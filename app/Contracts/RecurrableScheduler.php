<?php

namespace Kirki\Ecommerce\App\Contracts;

use Kirki\Ecommerce\Framework\Contracts\Action;

/**
 * Contract for a scheduled action that repeats until it decides to stop.
 *
 * @since 1.0.0
 */
interface RecurrableScheduler extends Action
{
    /**
     * Determine whether the recurring action should stop repeating.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function should_stop();

    /**
     * Get the extra arguments to pass to the next run.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>|false False when there are none.
     */
    public function get_additional_args();
}
