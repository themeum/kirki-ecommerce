<?php

namespace Kirki\Ecommerce;

use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Contracts\Support\Jsonable;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Supports\Arr;

abstract class Resource implements Arrayable, Jsonable
{
    protected $resource;

    public function __construct($resource)
    {
        if (is_array($resource)) {
            $this->resource = (object) $resource;
        } else {
            $this->resource = $resource;
        }
    }

    abstract public function to_array();

    /**
     * Create a new resource instance, or return null if the resource is null.
     *
     * @param mixed $resource The resource to create a new instance of.
     *
     * @return array|null
     */
    public static function make($resource)
    {
        if ($resource === null) {
            return null;
        }

        return (new static($resource))->to_array();
    }

    /**
     * Converts an iterable of resources into an array of resource representations.
     *
     * This method loops over the iterable and creates a new instance of the resource
     * class for each item, then calls the to_array method on the resource to
     * obtain its representation as an array.
     *
     * @param iterable $resources The iterable of resources to convert.
     *
     * @return array The array of resource representations.
     */
    public static function collection($resources)
    {
        $data = [];

        if (empty($resources)) {
            return $data;
        }

        if ($resources instanceof Collection) {
            $resources = $resources->all();
        }

        foreach ($resources as $resource) {
            $data[] = (new static($resource))->to_array();
        }

        return $data;
    }

    /**
     * Converts a paginator object into an array of resource representations,
     * including pagination metadata.
     *
     * This method loops over the paginator's results and creates a new instance
     * of the resource class for each item, then calls the to_array method on
     * the resource to obtain its representation as an array.
     *
     * @param Paginator $paginator The paginator object to convert.
     *
     * @return array The array of resource representations, including pagination metadata.
     */
    public static function paginated(Paginator $paginator)
    {
        $paginated_data = $paginator->to_array();

        foreach ($paginated_data['results'] as $key => $resource) {
            $paginated_data['results'][$key] = (new static($resource))->to_array();
        }

        return $paginated_data;
    }

    /**
     * Convert the resource to a JSON string.
     *
     * Encodes the array form of the resource for straightforward transport or
     * logging purposes.
     *
     * @return string The JSON-encoded paginator representation
     * @since 1.0.0
     */
    public function to_json($options = 0)
    {
        return Arr::json_encode($this->to_array(), $options);
    }

    /**
     * Check if a property exists on the underlying resource.
     *
     * This magic method allows you to check if a property exists on the underlying resource
     * as if it were a property of the current class. This provides a convenient way of
     * checking for the existence of resource properties without having to explicitly call a method.
     *
     * @param string $name The name of the property to check.
     *
     * @return bool True if the property exists, false otherwise.
     */
    public function __isset($name)
    {
        return isset($this->resource->$name);
    }

    /**
     * Dynamically pass properties of the underlying resource to the caller.
     *
     * This magic method allows you to access properties of the underlying resource
     * as if they were properties of the current class. This provides a convenient
     * way of accessing resource properties without having to explicitly call a method.
     *
     * @param string $name The name of the property to access.
     *
     * @return mixed The value of the accessed property.
     */
    public function __get($name)
    {
        return $this->resource->$name ?? null;
    }

    /**
     * Dynamically pass properties of the underlying resource to the caller.
     *
     * This magic method allows you to access properties of the underlying resource
     * as if they were properties of the current class. This provides a convenient
     * way of accessing resource properties without having to explicitly call a method.
     *
     * @param string $name The name of the property to access.
     *
     * @return $this The current instance.
     */
    public function __set($name, $value)
    {
        $this->resource->$name = $value;

        return $this;
    }

    /**
     * Dynamically pass method calls of the underlying resource to the caller.
     *
     * This magic method allows you to call methods of the underlying resource
     * as if they were methods of the current class. This provides a convenient
     * way of accessing resource methods without having to explicitly call a method.
     *
     * @param string $method The name of the method to access.
     * @param array $args The arguments to pass to the method.
     *
     * @return mixed The return value of the accessed method.
     */
    public function __call($method, $args)
    {
        return $this->resource->$method(...$args);
    }
}
