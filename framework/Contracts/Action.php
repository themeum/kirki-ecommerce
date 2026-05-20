<?php

namespace Kirki\Ecommerce\Contracts;

/**
 * Interface Action
 *
 * Represents a general-purpose action contract.
 * Any class implementing this interface should define the `handle` method,
 * which encapsulates the logic to be executed for the action.
 *
 * This can be used for plugin lifecycle hooks, event listeners, jobs,
 * or any task-oriented class that needs a unified callable structure.
 *
 * @since 1.0.0
 */
interface Action
{
    /**
     * Execute the action logic.
     *
     * @return void
     */
    public function handle();
}
