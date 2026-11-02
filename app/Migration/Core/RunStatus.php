<?php

namespace Kirki\Ecommerce\App\Migration\Core;

defined('ABSPATH') || exit;

/**
 * Allowed status values of a migration run and of each group inside it.
 *
 * @since 1.0.0
 */
final class RunStatus
{
    public const PENDING = 'pending';
    public const RUNNING = 'running';
    public const FAILED = 'failed';
    public const DONE = 'done';
}
