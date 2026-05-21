<?php

namespace Kirki\Ecommerce\Supports;

use ArrayAccess;
use IteratorAggregate;
use ArrayIterator;
use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Contracts\Support\Jsonable;
use Kirki\Ecommerce\Collections\Collection;
use InvalidArgumentException;
use Traversable;

/**
 * The array helper class.
 *
 * @since 1.0.0
 */
class Arr implements ArrayAccess, IteratorAggregate
{
    /**
     * The array items.
     *
     * @var array
     *
     * @since 1.0.0
     */
    protected $items = [];

    /**
     * The private constructor method that helps the class to instantiate from outside,
     * Instead it enforce to use the Arr::make() method to instantiate the array instance.
     *
     * @param array $items The initial array items
     *
     * @since 1.0.0
     */
    protected function __construct(array $items = [])
    {
        $this->items = $items;
    }

    /**
     * Make an instance of the Arr class.
     *
     * @param array $items The initial array items
     *
     * @return self
     *
     * @since 1.0.0
     */
    public static function make(array $items = [])
    {
        return (new self($items));
    }

    /**
     * Create an array from the given items.
     *
     * @param mixed $items The items to create an array from
     * 
     * @return array
     * 
     * @throws InvalidArgumentException If the items cannot be represented by a scalar value
     * @since 1.0.0
     */
    public static function from($items)
    {
        switch (true) {
            case is_array($items):
                return $items;
            case $items instanceof Arrayable:
                return $items->to_array();
            case $items instanceof Jsonable:
                return json_decode($items->to_json(), true);
            case $items instanceof Collection:
                return $items->all();
            case is_object($items):
                return (array) $items;
            default:
                throw new InvalidArgumentException('Items cannot be represented by a scalar value.');
        }
    }

    /**
     * Check if the array has the provided key
     *
     * @param string $key The key to check
     *
     * @return boolean True if the key exists, false otherwise
     *
     * @since 1.0.0
     */
    public function has($key): bool
    {
        return isset($this->items[$key]);
    }

    /**
     * Get the value of the array by the key.
     *
     * @param string $key The key to retrieve
     * @param mixed $default The default value if the key doesn't exist
     *
     * @return mixed The value associated with the key or the default value
     *
     * @since 1.0.0
     */
    public function get($key, $default = null)
    {
        if (!$this->has($key)) {
            return $default;
        }

        return $this->items[$key];
    }

    /**
     * Set the value into the array. If the key exists then it will update the value. Add a new one otherwise.
     *
     * @param string $key The key to set
     * @param mixed $value The value to set
     *
     * @return void
     *
     * @since 1.0.0
     */
    public function set(string $key, $value)
    {
        $this->items[$key] = $value;
    }

    /**
     * Count the total number of items into the array.
     *
     * @return integer The number of items in the array
     *
     * @since 1.0.0
     */
    public function count(): int
    {
        return count($this->items);
    }

    /**
     * Add a new item at the end of the array
     *
     * @param mixed $value The value to add
     *
     * @return integer The updated array length
     *
     * @since 1.0.0
     */
    public function push($value): int
    {
        $this->items[] = $value;

        return $this->count();
    }

    /**
     * Add a new item to the beginning of the array.
     *
     * @param mixed $value The value to add
     *
     * @return integer The updated array length
     *
     * @since 1.0.0
     */
    public function prepend($value): int
    {
        array_unshift($this->items, $value);

        return $this->count();
    }

    /**
     * Remove an item from the end of the array.
     *
     * @return mixed The removed item
     *
     * @since 1.0.0
     */
    public function pop()
    {
        return array_pop($this->items);
    }

    /**
     * Remove and get an item from the beginning of the array.
     *
     * @return mixed The removed item
     *
     * @since 1.0.0
     */
    public function shift()
    {
        return array_shift($this->items);
    }

    /**
     * Pick the last element of the array.
     * If the array is empty then it will return null.
     * This will only pick the item, but does not remove it from the array.
     *
     * @return mixed The last element or null if the array is empty
     *
     * @since 1.0.0
     */
    public function top()
    {
        if ($this->count() === 0) {
            return null;
        }

        $length = $this->count();

        return $this->items[$length - 1];
    }

    /**
     * Pick the first element of the array.
     * If the array is empty then it will return null.
     * This will only pick the item, but does not remove it from the array.
     *
     * @return mixed The first element or null if the array is empty
     *
     * @since 1.0.0
     */
    public function front()
    {
        if ($this->count() === 0) {
            return null;
        }

        return $this->items[0];
    }

    /**
     * Flatten the array for the sequential array
     * 
     * @return array
     * @since 1.0.0
     */
    public static function flatten($array, $depth = INF)
    {
        $result = [];

        foreach ($array as $item) {
            $item = $item instanceof Collection ? $item->all() : $item;

            if (!is_array($item)) {
                $result[] = $item;
            } else {
                $values = $depth === 1
                    ? array_values($item)
                    : static::flatten($item, $depth - 1);

                foreach ($values as $value) {
                    $result[] = $value;
                }
            }
        }

        return $result;
    }


    /**
     * Filter the array by a callable function.
     * The function will return a true/false value and the return value is true then the value will be kept,
     * otherwise removed.
     *
     * @param array $array The array to filter
     * @param callable $callback The callable function for filtering
     *
     * @return array The filtered array
     *
     * @since 1.0.0
     */
    public static function where($array, callable $callback)
    {
        return array_filter($array, $callback, ARRAY_FILTER_USE_BOTH);
    }

    /**
     * Wrap the value in an array
     * 
     * @param mixed $value The value to wrap
     * 
     * @return array
     * @since 1.0.0
     */
    public static function wrap($value)
    {
        if (is_null($value)) {
            return [];
        }

        return is_array($value) ? $value : [$value];
    }


    /**
     * Run a map operation using a callable to the array.
     *
     * @param callable $callable The callable function
     *
     * @return static The new array after applying the callable
     *
     * @since 1.0.0
     */
    public function map(callable $callable)
    {
        $newArray = [];

        foreach ($this->items as $index => $value) {
            $newArray[] = $callable($value, $index);
        }

        return new static($newArray);
    }

    /**
     * Iterate over each item in the array.
     *
     * @param callable $callable The callable function
     *
     * @return void
     *
     * @since 1.0.0
     */
    public function foreach(callable $callable)
    {
        foreach ($this->items as $index => $value) {
            $callable($value, $index);
        }
    }

    /**
     * Filter the array by a callable function.
     * The function will return a true/false value and the return value is true then the value will be kept,
     * otherwise removed.
     *
     * @param callable $callable The callable function for filtering
     *
     * @return static The filtered array
     *
     * @since 1.0.0
     */
    public function filter(callable $callable)
    {
        $filteredArray = [];

        foreach ($this->items as $index => $value) {
            $result = $callable($value, $index);

            if ($result) {
                $filteredArray[] = $value;
            }
        }

        return new static($filteredArray);
    }

    /**
     * Find an item into the array by a callable function condition.
     *
     * @param callable $callable The callable function for finding
     *
     * @return mixed|null The found item or null if not found
     *
     * @since 1.0.0
     */
    public function find(callable $callable)
    {
        foreach ($this->items as $index => $value) {
            if ($callable($value, $index)) {
                return $value;
            }
        }

        return null;
    }

    /**
     * Find the index of an item into the array.
     * If not found then it will return -1.
     *
     * @param callable $callable The callable function for finding
     *
     * @return integer The index of the found item or -1 if not found
     *
     * @since 1.0.0
     */
    public function findIndex(callable $callable): int
    {
        foreach ($this->items as $index => $value) {
            if ($callable($value, $index)) {
                return $index;
            }
        }

        return -1;
    }

    /**
     * A boolean method that checks if the array satisfies a specific condition.
     * If it satisfies for only one item then it returns true.
     *
     * @param callable $callable The callable function for checking condition
     *
     * @return boolean True if any item satisfies the condition, false otherwise
     *
     * @since 1.0.0
     */
    public function some(callable $callable): bool
    {
        foreach ($this->items as $index => $value) {
            if ($callable($value, $index)) {
                return true;
            }
        }

        return false;
    }

    public static function is_associative(array $array): bool
    {
        return array_keys($array) !== range(0, count($array) - 1);
    }

    /**
     * A boolean method that checks if the array satisfies a specific condition.
     * If every items satisfies the condition then it will return true.
     *
     * @param callable $callable The callable function for checking condition
     *
     * @return boolean True if all items satisfy the condition, false otherwise
     *
     * @since 1.0.0
     */
    public function every(callable $callable): bool
    {
        foreach ($this->items as $index => $value) {
            if (!$callable($value, $index)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Replicate the array_reduce function for usage consistency
     *
     * @param callable $callable The callable function for reducing
     * @param mixed $initial_value The initial value for reduction
     *
     * @return static The result of the reduction
     *
     * @since 1.0.0
     */
    public function reduce(callable $callable, $initial_value)
    {
        return array_reduce($this->items, $callable, $initial_value);
    }

    /**
     * Join the array using a glue
     *
     * @param string $glue The symbol by which it will be joined
     *
     * @return string The joined string
     *
     * @since 1.0.0
     */
    public function join(string $glue = ',')
    {
        return implode($glue, $this->items);
    }

    /**
     * Pluck the array by a key
     *
     * @param string $key The key to pluck
     *
     * @return self The plucked array
     *
     * @since 1.0.0
     */
    public function pluck(string $key)
    {
        return $this->map(function ($item) use ($key) {
            return is_array($item) ? $item[$key] : $item->{$key};
        });
    }

    /**
     * Group the array by a key
     *
     * @param string $key The key to group by
     *
     * @return array The grouped array
     *
     * @since 1.0.0
     */
    public function group_by(string $key)
    {
        $grouped = $this->reduce(function ($carry, $item) use ($key) {
            if (!isset($carry[$item[$key]])) {
                $carry[$item[$key]] = [];
            }

            $carry[$item[$key]][] = $item;

            return $carry;
        }, [])->to_array();

        return array_values($grouped);
    }

    /**
     * Diff the associative array by the provided array
     * 
     * @param array $array The array to diff
     * 
     * @return static
     * @since 1.0.0
     */
    public function diff_assoc(array $array)
    {
        $array = $array instanceof self ? $array->to_array() : $array;

        return new static(
            array_diff_assoc($this->items, $array)
        );
    }

    /**
     * Diff the array by the provided array
     * 
     * @param array $array The array to diff
     * 
     * @return static
     * @since 1.0.0
     */
    public function diff(array $array)
    {
        $array = $array instanceof self ? $array->to_array() : $array;

        return new static(
            array_values(
                array_diff($this->items, $array)
            )
        );
    }

    /**
     * Convert the array to an array
     *
     * @return array The array
     *
     * @since 1.0.0
     */
    public function to_array(): array
    {
        return $this->is_associative($this->items)
            ? $this->items
            : array_values($this->items);
    }

    /**
     * Checks whether an offset exists
     *
     * @param mixed $key An offset to check for
     *
     * @return bool True if the offset exists, false otherwise
     *
     * @since 1.0.0
     */
    public function offsetExists($key): bool
    {
        return $this->has($key);
    }

    /**
     * Offset to retrieve
     *
     * @param mixed $key The offset to retrieve
     *
     * @return mixed The value at the specified offset
     *
     * @since 1.0.0
     */
    #[\ReturnTypeWillChange]
    public function offsetGet($key)
    {
        return $this->get($key);
    }

    /**
     * Offset to set
     *
     * @param mixed $key The offset to assign the value to
     * @param mixed $value The value to set
     *
     * @return void
     *
     * @since 1.0.0
     */
    public function offsetSet($key, $value): void
    {
        $this->set($key, $value);
    }

    /**
     * Offset to unset
     *
     * @param mixed $key The offset to unset
     *
     * @return void
     *
     * @since 1.0.0
     */
    public function offsetUnset($key): void
    {
        unset($this->items[$key]);
    }

    /**
     * Get the iterator
     *
     * @return Traversable The iterator
     *
     * @since 1.0.0
     */
    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->items);
    }

    /**
     * Return a new instance containing only the specified keys
     *
     * @param array $keys The keys to keep
     *
     * @return array A new instance containing only the specified keys
     *
     * @since 1.0.0
     */
    public static function only(array $items, array $keys)
    {
        return array_intersect_key($items, array_flip($keys));
    }

    /**
     * Collapse an array of arrays into a single array.
     *
     * @param array $values The array of arrays to collapse
     *
     * @return array The collapsed array
     *
     * @since 1.0.0
     */
    public static function collapse($values)
    {
        $results = [];

        foreach ($values as $item) {
            if ($item instanceof Collection) {
                $results[] = $item->all();
            } elseif (is_array($item)) {
                $results[] = $item;
            }
        }

        return array_merge([], ...$results);
    }

    /**
     * Check if the value is accessible.
     *
     * @param mixed $value The value to check
     *
     * @return boolean True if the value is accessible, false otherwise
     *
     * @since 1.0.0
     */
    public static function accessible($value)
    {
        return is_array($value) || $value instanceof Arrayable;
    }

    /**
     * Check if the array has a key.
     *
     * @param array $array The array to check
     * @param mixed $key The key to check for
     *
     * @return boolean True if the array has the key, false otherwise
     *
     * @since 1.0.0
     */
    public static function exists($array, $key)
    {
        if ($array instanceof ArrayAccess) {
            return $array->offsetExists($key);
        }

        if (is_float($key) || is_null($key)) {
            $key = (string) $key;
        }

        return array_key_exists($key, $array);
    }

    /**
     * Convert the array to a JSON string
     *
     * @param array $array The array to convert
     * @param int $flags The flags to use for JSON encoding
     * @param int $depth The maximum depth to encode
     *
     * @return string The JSON string
     *
     * @since 1.0.0
     */
    public static function json_encode($array, $flags = 0, $depth = 512)
    {
        return wp_json_encode($array, $flags, $depth);
    }
}
