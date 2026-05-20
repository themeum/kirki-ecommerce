<?php

namespace Kirki\Ecommerce\Contracts;

use Closure;

interface Container
{
    /**
     * Bind a class to the container.
     *
     * @param string $name
     * @param Closure $resolver
     * @return void
     */
    public function bind(string $name, Closure $resolver);

    /**
     * Bind a class to the container as a singleton (lazy loaded).
     *
     * @param string $name
     * @param Closure $resolver
     * @return void
     */
    public function singleton(string $name, Closure $resolver);

    /**
     * Bind an existing instance to the container.
     *
     * @param string $name
     * @param mixed $instance
     * @return void
     */
    public function instance(string $name, $instance);

    /**
     * Create an alias for a service.
     *
     * @param string $alias
     * @param string $abstract
     * @return void
     */
    public function alias(string $alias, string $abstract);

    /**
     * Tag services for grouped resolution.
     *
     * @param array $services
     * @param string $tag
     * @return void
     */
    public function tag(array $services, string $tag);

    /**
     * Get all services with a given tag.
     *
     * @param string $tag
     * @return array
     */
    public function tagged(string $tag): array;

    /**
     * Make a class from the container.
     *
     * @param string $name
     * @param array $parameters
     * @return mixed
     */
    public function make(string $name, array $parameters = []);

    /**
     * Check if a class exists in the container.
     *
     * @param string $name
     * @return bool
     */
    public function has(string $name): bool;

    /**
     * Flush all bindings and instances.
     *
     * @return void
     */
    public function flush();
}
