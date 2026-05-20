<?php

namespace Kirki\Ecommerce\Concerns;

use Closure;
use Kirki\Ecommerce\Supports\Facades\Event;

defined('ABSPATH') || exit;

trait Dispatchable
{
    /**
     * Dispatch the event.
     *
     * @param mixed $arguments
     * @return void
     */
    public static function dispatch()
    {
        Event::dispatch(new static(...func_get_args()));
    }

    /**
     * Dispatch the event if the boolean is true.
     *
     * @param mixed $boolean
     * @param mixed $arguments
     * @return void
     */
    public static function dispatch_if($boolean, ...$arguments)
    {
        $boolean = $boolean instanceof Closure ? $boolean() : $boolean;

        if ($boolean) {
            Event::dispatch(new static(...$arguments));
        }
    }

    /**
     * Dispatch the event unless the boolean is true.
     *
     * @param mixed $boolean
     * @param mixed $arguments
     * @return void
     */
    public static function dispatch_unless($boolean, ...$arguments)
    {
        $boolean = $boolean instanceof Closure ? $boolean() : $boolean;

        if (!$boolean) {
            Event::dispatch(new static(...$arguments));
        }
    }
}
