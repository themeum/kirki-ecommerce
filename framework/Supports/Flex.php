<?php

namespace Kirki\Ecommerce\Supports;

use ArrayAccess;
use ArrayIterator;
use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Contracts\Support\Jsonable;
use IteratorAggregate;
use JsonSerializable;
use Traversable;

/**
 * @template TKey as string
 * @template TValue
 *
 * @package Kirki\Ecommerce\Supports
 *
 * @since 1.0.0
 */
class Flex implements ArrayAccess, IteratorAggregate, Arrayable, Jsonable, JsonSerializable
{
    /**
     * @var array
     */
    protected $attributes = [];

    /**
     * @param array $attributes
     */
    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
    }

    /**
     * Fill the attributes with the given array.
     *
     * @param array $attributes
     */
    protected function fill(array $attributes)
    {
        foreach ($attributes as $key => $value) {
            $this->attributes[$key] = $value;
        }
    }

    /**
     * Get the value of a given attribute.
     *
     * @param string $key The attribute key.
     * @param mixed $default The default value if the attribute does not exist.
     *
     * @return mixed
     *
     * @since 1.0.0
     */
    public function get($key, $default = null)
    {
        if (!array_key_exists($key, $this->attributes)) {
            return $default;
        }

        return $this->attributes[$key];
    }

    /**
     * Check if a given attribute exists.
     *
     * @param string $key The attribute key.
     *
     * @return bool
     *
     * @since 1.0.0
     */
    public function exists($key)
    {
        return array_key_exists($key, $this->attributes);
    }

    /**
     * Set the value of a given attribute.
     *
     * @param string $key The attribute key.
     * @param mixed $value The value to set.
     *
     * @return $this
     *
     * @since 1.0.0
     */
    public function set($key, $value)
    {
        $this->attributes[$key] = $value;

        return $this;
    }

    /**
     * Get all attributes as an array.
     *
     * @return array
     *
     * @since 1.0.0
     */
    public function to_array()
    {
        return $this->attributes;
    }

    /**
     * Magic getter for attributes.
     *
     * @param string $name The attribute name.
     *
     * @return mixed
     *
     * @since 1.0.0
     */
    public function __get($name)
    {
        return $this->get($name);
    }

    /**
     * Magic setter for attributes.
     *
     * @param string $name The attribute name.
     * @param mixed $value The value to set.
     *
     * @since 1.0.0
     */
    public function __set($name, $value)
    {
        $this->set($name, $value);
    }

    /**
     * Magic isset to check if an attribute exists.
     *
     * @param string $name The attribute name.
     *
     * @return bool
     *
     * @since 1.0.0
     */
    public function __isset($name)
    {
        return $this->exists($name);
    }

    /**
     * Magic unset to remove an attribute.
     *
     * @param string $name The attribute name.
     *
     * @since 1.0.0
     */
    public function __unset($name)
    {
        unset($this->attributes[$name]);
    }

    /**
     * Determine if the given offset exists.
     *
     * @param  TKey  $offset
     * @return bool
     */
    public function offsetExists($offset): bool
    {
        return isset($this->attributes[$offset]);
    }

    /**
     * Get the value for a given offset.
     *
     * @param  TKey  $offset
     * @return TValue|null
     */
    public function offsetGet($offset): mixed
    {
        return $this->value($offset);
    }

    /**
     * Set the value at the given offset.
     *
     * @param  TKey  $offset
     * @param  TValue  $value
     * @return void
     */
    public function offsetSet($offset, $value): void
    {
        $this->attributes[$offset] = $value;
    }

    /**
     * Unset the value at the given offset.
     *
     * @param  TKey  $offset
     * @return void
     */
    public function offsetUnset($offset): void
    {
        unset($this->attributes[$offset]);
    }

    /**
     * Get an iterator for the attributes.
     *
     * @return ArrayIterator<TKey, TValue>
     */
    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->attributes);
    }

    /**
     * Specify data which should be serialized to JSON.
     *
     * @return array
     */
    public function jsonSerialize(): array
    {
        return $this->to_array();
    }

    /**
     * Convert the object to a JSON string.
     *
     * @param  int  $options
     * @return string
     */
    public function to_json($options = 0)
    {
        return Arr::json_encode($this->jsonSerialize(), $options);
    }

    /**
     * Magic call to set an attribute by method name.
     *
     * @param string $method The method name (attribute key).
     * @param array $arguments The arguments to set as value.
     *
     * @return $this
     *
     * @since 1.0.0
     */
    public function __call($method, $arguments)
    {
        $this->attributes[$method] = count($arguments) > 0 ? reset($arguments) : true;

        return $this;
    }
}
