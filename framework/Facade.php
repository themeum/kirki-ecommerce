<?php

namespace Kirki\Ecommerce;

use RuntimeException;

use function Kirki\Ecommerce\app;

/**
 * Abstract Facade base class for providing static interface to service container bindings.
 *
 * This class allows static method calls to be forwarded to underlying service instances
 * resolved from the application container. Child classes must implement get_accessor()
 * to specify the service binding key.
 *
 * @package Kirki\Ecommerce\Core
 */
abstract class Facade
{
    /**
     * The array of resolved service instances keyed by accessor name.
     *
     * @var array
     */
    protected static $resolved_instance = [];

    /**
     * Whether the facade is cacheable.
     *
     * @var bool
     */
    protected static $is_cacheable = true;

    /**
     * Get the accessor key for the service in the container.
     *
     * Child classes must implement this method to return the string accessor
     * used to resolve the service from the application container.
     *
     * @return string
     */
    abstract public static function get_accessor();

    /**
     * Resolve the underlying service instance for the given accessor name.
     *
     * If the name is already an object, it is returned directly. Otherwise,
     * the service is resolved from the application container and cached.
     *
     * @param string|object $name The accessor name or an object instance
     * @return object The resolved service instance
     */
    protected static function resolved_facade_instance($name)
    {
        if (is_object($name)) {
            return $name;
        }

        if (static::$is_cacheable && isset(static::$resolved_instance[$name])) {
            return static::$resolved_instance[$name];
        }

        $instance = app($name);

        if (static::$is_cacheable) {
            static::$resolved_instance[$name] = $instance;
        }

        return $instance;
    }

    /**
     * Dynamically handle static method calls to the facade.
     *
     * Forwards the static call to the resolved service instance, passing all arguments.
     * Throws a RuntimeException if the service instance cannot be resolved.
     *
     * @param string $method The method name being called
     * @param array $arguments The arguments passed to the method
     * @return mixed The result of the underlying method call
     * @throws \RuntimeException If the service instance is not set
     */
    public static function __callStatic($method, $arguments)
    {
        $instance = static::resolved_facade_instance(static::get_accessor());

        if (!$instance) {
            throw new RuntimeException(__(
                'A facade has not been set.',
                'kirki-ecommerce'
            ));
        }

        return $instance->$method(...$arguments);
    }
}
