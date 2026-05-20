<?php

namespace Kirki\Ecommerce\Managers;

use Closure;
use Kirki\Ecommerce\Listener;
use InvalidArgumentException;

use function Kirki\Ecommerce\config_path;

class EventManager
{
    /**
     * The listeners array.
     *
     * @var array
     */
    protected array $listeners = [];

    /**
     * Create a new event manager instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->load_listeners();
    }

    /**
     * Load the listeners from the cache.
     *
     * @return $this
     */
    protected function load_listeners()
    {
        $listeners_cache_path = config_path('listeners.cache.php');

        if (!file_exists($listeners_cache_path)) {
            return $this;
        }

        $this->listeners = require $listeners_cache_path;

        return $this;
    }

    /**
     * Dispatch the event.
     *
     * @param mixed $event
     * @return void
     */
    public function dispatch($event)
    {
        if (!is_object($event)) {
            throw new InvalidArgumentException(sprintf(
                __('The event must be an object, got [%s]', 'kirki-ecommerce'),
                gettype($event)
            ));
        }

        $event_class = get_class($event);

        if (!isset($this->listeners[$event_class])) {
            return;
        }

        $event_listeners = $this->listeners[$event_class] ?? [];

        foreach ($event_listeners as $listener) {
            $this->resolve($listener, $event);
        }
    }

    /**
     * Dispatch the event if the boolean is true.
     *
     * @param Closure $boolean
     * @param mixed $event
     * @return void
     */
    public function dispatch_if(Closure $boolean, $event)
    {
        if ($boolean($event)) {
            $this->dispatch($event);
        }
    }

    /**
     * Dispatch the event unless the boolean is true.
     *
     * @param Closure $boolean
     * @param mixed $event
     * @return void
     */
    public function dispatch_unless(Closure $boolean, $event)
    {
        if (!$boolean($event)) {
            $this->dispatch($event);
        }
    }

    protected function resolve($listener, $event)
    {
        if (!is_subclass_of($listener, Listener::class)) {
            throw new InvalidArgumentException(sprintf(
                __('The listener [%s] must be a subclass of [%s]', 'kirki-ecommerce'),
                Listener::class
            ));
        }

        return (new $listener())->handle($event);
    }
}
