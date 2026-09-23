<?php

namespace Kirki\Ecommerce\App\Supports;

use ArrayAccess;
use ArrayIterator;
use Kirki\Ecommerce\Framework\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Framework\Contracts\Support\Jsonable;
use IteratorAggregate;
use JsonSerializable;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Traversable;

/**
 * Flexible attribute bag with property, array and fluent method access.
 *
 * @template TKey as string
 * @template TValue
 *
 * @since 1.0.0
 */
class Flex implements ArrayAccess, IteratorAggregate, Arrayable, Jsonable, JsonSerializable
{
    /**
     * @var array<string, mixed>
     */
    protected $attributes = [];

    /**
     * Create a new flex instance.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $attributes Initial attributes.
     */
    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
    }

    /**
     * Fill the attributes with the given array.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $attributes
     * @return void
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
     * @since 1.0.0
     *
     * @param string $key     The attribute key.
     * @param mixed  $default The default value if the attribute does not exist.
     * @return mixed
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
     * @since 1.0.0
     *
     * @param string $key The attribute key.
     * @return bool
     */
    public function exists($key)
    {
        return array_key_exists($key, $this->attributes);
    }

    /**
     * Set the value of a given attribute.
     *
     * @since 1.0.0
     *
     * @param string $key   The attribute key.
     * @param mixed  $value The value to set.
     * @return $this
     */
    public function set($key, $value)
    {
        $this->attributes[$key] = $value;

        return $this;
    }

    /**
     * Get all attributes as an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function to_array()
    {
        return $this->attributes;
    }

    /**
     * Magic getter for attributes.
     *
     * @since 1.0.0
     *
     * @param string $name The attribute name.
     * @return mixed
     */
    public function __get($name)
    {
        return $this->get($name);
    }

    /**
     * Magic setter for attributes.
     *
     * @since 1.0.0
     *
     * @param string $name  The attribute name.
     * @param mixed  $value The value to set.
     * @return void
     */
    public function __set($name, $value)
    {
        $this->set($name, $value);
    }

    /**
     * Magic isset to check if an attribute exists.
     *
     * @since 1.0.0
     *
     * @param string $name The attribute name.
     * @return bool
     */
    public function __isset($name)
    {
        return $this->exists($name);
    }

    /**
     * Magic unset to remove an attribute.
     *
     * @since 1.0.0
     *
     * @param string $name The attribute name.
     * @return void
     */
    public function __unset($name)
    {
        unset($this->attributes[$name]);
    }

    /**
     * Determine if the given offset exists.
     *
     * Reports false for an attribute that is set to null.
     *
     * @since 1.0.0
     *
     * @param TKey $offset
     * @return bool
     */
    public function offsetExists($offset): bool
    {
        return isset($this->attributes[$offset]);
    }

    /**
     * Get the value for a given offset.
     *
     * @since 1.0.0
     *
     * @param TKey $offset
     * @return TValue|null
     */
    public function offsetGet($offset)
    {
        return $this->value($offset);
    }

    /**
     * Set the value at the given offset.
     *
     * @since 1.0.0
     *
     * @param TKey   $offset
     * @param TValue $value
     * @return void
     */
    public function offsetSet($offset, $value): void
    {
        $this->attributes[$offset] = $value;
    }

    /**
     * Unset the value at the given offset.
     *
     * @since 1.0.0
     *
     * @param TKey $offset
     * @return void
     */
    public function offsetUnset($offset): void
    {
        unset($this->attributes[$offset]);
    }

    /**
     * Get an iterator for the attributes.
     *
     * @since 1.0.0
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
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->to_array();
    }

    /**
     * Convert the object to a JSON string.
     *
     * @since 1.0.0
     *
     * @param int $options `json_encode` flags.
     * @return string
     */
    public function to_json($options = 0)
    {
        return Arr::json_encode($this->jsonSerialize(), $options);
    }

    /**
     * Magic call to set an attribute by method name.
     *
     * Sets the attribute to the first argument, or to true when called without arguments.
     *
     * @since 1.0.0
     *
     * @param string  $method    The method name (attribute key).
     * @param mixed[] $arguments The arguments to set as value.
     * @return $this
     */
    public function __call($method, $arguments)
    {
        $this->attributes[$method] = count($arguments) > 0 ? reset($arguments) : true;

        return $this;
    }
}
