<?php

namespace Kirki\Ecommerce\Wordpress;

use Kirki\Ecommerce\Wordpress\Contracts\HookSubscriber;

/**
 * Class BaseHook
 *
 * Provides a base implementation of the HookSubscriber interface with default
 * values for priority and argument count. Subclasses must implement:
 * - get_name()
 * - get_type()
 * - handle()
 *
 * This class also defines constants for hook types: ACTION and FILTER.
 * 
 * @since 1.0.0
 */
abstract class BaseHook implements HookSubscriber
{
    /**
     * Get the priority for this hook. Can be overridden by subclasses.
     *
     * @return int Hook priority. Lower numbers correspond to earlier execution.
     */
    public function get_priority()
    {
        return 10;
    }

    /**
     * Get the number of arguments accepted by the hook callback.
     * Can be overridden by subclasses.
     *
     * @return int Number of accepted arguments.
     */
    public function get_args_count()
    {
        return 1;
    }

    abstract public function get_name();

    abstract public function get_type();

    abstract public function handle(...$args);
}
