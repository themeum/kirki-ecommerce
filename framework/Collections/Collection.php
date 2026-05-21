<?php

namespace Kirki\Ecommerce\Collections;

use ArrayAccess;
use Closure;
use Countable;
use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Contracts\Support\Jsonable;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Supports\Traits\Conditionable;
use InvalidArgumentException;
use Iterator;
use JsonSerializable;

/**
 * Represent a simple iterable collection of items.
 *
 * Provide a lightweight wrapper around arrays with common helper methods
 * such as mapping, filtering, iteration, and JSON/array conversion. Used
 * throughout the ORM to return sets of models or raw records while offering
 * a consistent API for traversal and transformation.
 *
 * @since 1.0.0
 */
class Collection implements ArrayAccess, Countable, Iterator, Arrayable, Jsonable, JsonSerializable
{
    use Conditionable;

    /**
     * The array of items contained in the collection.
     *
     * Stores the elements managed by the collection, which may be model instances
     * or raw values. Used for all collection operations such as iteration, mapping,
     * and conversion to arrays or JSON.
     *
     * @var array
     */
    protected $items = [];

    /**
     * The current position of the iterator.
     *
     * Tracks the index within the items array for implementing the Iterator interface,
     * allowing the collection to be traversed using foreach and other iteration constructs.
     *
     * @var int
     */
    protected $position = 0;

    /**
     * Create a new collection instance from an array of items.
     *
     * Accept an array of values or model instances to initialize the internal
     * storage. This is used by query results and relation loaders to wrap raw
     * arrays in a consistent interface for further processing and consumption.
     *
     * @param array $items The items to seed the collection
     * @return void No return value; initializes internal state
     * @since 1.0.0
     */
    public function __construct(array $items = [])
    {
        $this->items = $items;
    }

    /**
     * Create a new collection instance from a range of numbers.
     *
     * @param int $start The start of the range
     * @param int $end The end of the range
     * @param int $step The step of the range
     *
     * @return static A new collection instance
     *
     * @since 1.0.0
     */
    public static function range($start, $end, $step = 1)
    {
        return new static(range($start, $end, $step));
    }

    /**
     * Retrieve all items as a plain array.
     *
     * Return the underlying array without modification. Useful when consumers
     * need direct array semantics or to interoperate with functions expecting
     * native arrays instead of collection instances.
     *
     * @return array The raw array of items stored in the collection
     * @since 1.0.0
     */
    public function all()
    {
        return $this->items;
    }

    /**
     * Get the values of the collection.
     *
     * @return static A new collection containing the values
     * @since 1.0.0
     */
    public function values()
    {
        return new static(array_values($this->items));
    }

    /**
     * Determine if the collection contains a given item.
     *
     * @param mixed $key The item to check for
     * 
     * @return bool True if the collection contains the item, false otherwise
     * @since 1.0.0
     */
    public function contains($value, bool $strict = false)
    {
        if ($value instanceof Closure) {
            foreach ($this->items as $index => $item) {
                if ($value($item, $index)) {
                    return true;
                }
            }

            return false;
        }

        return in_array($value, $this->items, $strict);
    }

    /**
     * Determine if the collection contains a given item using strict comparison.
     *
     * @param mixed $key The item to check for
     * @return bool True if the collection contains the item, false otherwise
     * @since 1.0.0
     */
    public function contains_strict($value)
    {
        return $this->contains($value, true);
    }

    /**
     * Determine if the collection does not contain a given item.
     *
     * @param mixed $value The item to check for
     * @return bool True if the collection does not contain the item, false otherwise
     * @since 1.0.0
     */
    public function not_contains($value)
    {
        return !$this->contains($value);
    }

    /**
     * Determine if the collection does not contain a given item using strict comparison.
     *
     * @param mixed $value The item to check for
     * @return bool True if the collection does not contain the item, false otherwise
     * @since 1.0.0
     */
    public function not_contains_strict($value)
    {
        return !$this->contains_strict($value);
    }

    /**
     * Diff the collection with the given items.
     *
     * @param mixed $items The items to diff with the collection
     * @return static A new collection containing the diff
     * @since 1.0.0
     */
    public function diff($items)
    {
        return new static(
            array_diff($this->items, $this->get_arrayable_items($items))
        );
    }

    /**
     * Get the arrayable items from the given items.
     *
     * @param mixed $items The items to get the arrayable items from
     * @return array The arrayable items
     * @since 1.0.0
     */
    public function get_arrayable_items($items)
    {
        return is_null($items) || is_scalar($items)
            ? Arr::wrap($items)
            : Arr::from($items);
    }

    /**
     * Get the first item in the collection.
     *
     * Returns null when the collection is empty. This is typically used to
     * access a single model or value from a previously constrained result set
     * without performing additional checks.
     *
     * @return mixed The first item or null when no items exist
     * @since 1.0.0
     */
    public function first()
    {
        return !empty($this->items) ? $this->items[0] : null;
    }

    /**
     * Get the last item in the collection.
     *
     * Uses PHP's end pointer to retrieve the last element when available and
     * returns null when the collection is empty. Helpful for ordered results
     * where the terminal element is meaningful.
     *
     * @return mixed The last item or null when no items exist
     * @since 1.0.0
     */
    public function last()
    {
        return !empty($this->items) ? end($this->items) : null;
    }

    /**
     * Count the number of items in the collection.
     *
     * Implements Countable and returns the total item count. This mirrors
     * PHP's count behavior and is frequently used in pagination and guards.
     *
     * @return int The number of items contained in the collection
     * @since 1.0.0
     */
    public function count(): int
    {
        return count($this->items);
    }

    /**
     * Determine if the collection has no items.
     *
     * This is the logical opposite of has items and is commonly used for
     * guard clauses when rendering or transforming result sets.
     *
     * @return bool True when empty; false otherwise
     * @since 1.0.0
     */
    public function is_empty()
    {
        return empty($this->items);
    }

    /**
     * Determine if the collection contains at least one item.
     *
     * Provides a more readable alternative to negating isEmpty when checking
     * for the presence of results before proceeding with further logic.
     *
     * @return bool True when one or more items exist; false when empty
     * @since 1.0.0
     */
    public function is_not_empty()
    {
        return !$this->is_empty();
    }

    /**
     * Add one or more items to the end of the collection.
     *
     * @param mixed $values The values to add to the collection
     * @return $this The collection instance for method chaining
     * @since 1.0.0
     */
    public function push(...$values)
    {
        foreach ($values as $value) {
            $this->items[] = $value;
        }

        return $this;
    }

    /**
     * Add one or more items to the beginning of the collection.
     *
     * @param mixed $values The values to add to the collection
     * @return $this The collection instance for method chaining
     * @since 1.0.0
     */
    public function unshift(...$values)
    {
        array_unshift($this->items, ...$values);

        return $this;
    }

    /**
     * Remove and return the last item from the collection.
     *
     * @return mixed The removed item or null if the collection is empty
     * @since 1.0.0
     */
    public function pop()
    {
        return array_pop($this->items);
    }

    /**
     * Reverse the order of the collection items.
     *
     * @return static A new collection with the items in reverse order
     * @since 1.0.0
     */
    public function reverse()
    {
        return new static(array_reverse($this->items, true));
    }

    /**
     * Transform each item in the collection using a callback.
     *
     * The callback receives the item and its key, and the return values are
     * collected into a new collection. This does not mutate the original and
     * supports fluent method chaining by returning a collection instance.
     *
     * @param callable $callback The transformer to apply to each item
     * @return static A new collection containing transformed items
     * @since 1.0.0
     */
    public function map(callable $callback)
    {
        $results = [];
        foreach ($this->items as $key => $item) {
            $results[$key] = $callback($item, $key);
        }
        return new static($results);
    }

    /**
     * Collapse a collection of arrays into a single array.
     *
     * @return static A new collection containing collapsed items
     * @since 1.0.0
     */
    public function collapse()
    {
        return new static(Arr::collapse($this->items));
    }

    /**
     * Transform each item in the collection using a callback.
     *
     * The callback receives the item and its key, and the return values are
     * collected into a new collection. This does not mutate the original and
     * supports fluent method chaining by returning a collection instance.
     *
     * @param callable $callback The transformer to apply to each item
     * @return static A new collection containing transformed items
     * @since 1.0.0
     */
    public function flat_map(callable $callback)
    {
        return $this->map($callback)->collapse();
    }

    /**
     * Filter items in the collection using a callback predicate.
     *
     * The callback should return truthy for items to keep. A new collection is
     * returned leaving the original intact, enabling immutable-style chaining
     * and reuse of the source collection.
     *
     * @param callable $callback The predicate determining which items remain
     * @return static A new collection containing only matching items
     * @since 1.0.0
     */
    public function filter($callback)
    {
        if ($callback) {
            return new static(Arr::where($this->items, $callback));
        }

        return new static(array_filter($this->items));
    }

    /**
     * Reject items in the collection using a callback predicate.
     *
     * The callback should return false for items to reject. A new collection is
     * returned leaving the original intact, enabling immutable-style chaining
     * and reuse of the source collection.
     *
     * @param callable $callback The predicate determining which items remain
     * 
     * @return static A new collection containing only matching items
     * 
     * @since 1.0.0
     */
    public function reject($callback = true)
    {
        return $this->filter(function ($value, $key) use ($callback) {
            return is_callable($callback)
                ? !$callback($value, $key)
                : $value != $callback;
        });
    }

    /**
     * Iterate over each item and invoke the given callback.
     *
     * The callback receives the item and key. If the callback returns false,
     * iteration stops early. This method returns the collection instance for
     * method chaining with subsequent operations.
     *
     * @param callable $callback The function to invoke for each item
     * @return $this The collection instance for method chaining
     * @since 1.0.0
     */
    public function each(callable $callback)
    {
        foreach ($this->items as $key => $item) {
            if ($callback($item, $key) === false) {
                break;
            }
        }
        return $this;
    }

    /**
     * Determine if the collection satisfies a given condition.
     *
     * @param callable $callback The callback to check the items
     * @return bool True if the collection satisfies the condition, false otherwise
     * @since 1.0.0
     */
    public function some(callable $callback)
    {
        foreach ($this->items as $key => $item) {
            if ($callback($item, $key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Determine if the collection satisfies a given condition.
     *
     * @param callable $callback The callback to check the items
     * @return bool True if the collection satisfies the condition, false otherwise
     * @since 1.0.0
     */
    public function every(callable $callback)
    {
        foreach ($this->items as $key => $item) {
            if (!$callback($item, $key)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Extract a single column or property from each item.
     *
     * For objects, attempts to read the property; for arrays, reads the array
     * key. Missing properties or keys are represented as null. A new collection
     * of the extracted values is returned for additional transformations.
     *
     * @param mixed $column The property or key to extract from each item
     * @return static A new collection of extracted column values
     * @since 1.0.0
     */
    public function pluck($column)
    {
        $results = [];
        foreach ($this->items as $item) {
            if (is_object($item)) {
                $results[] = $item->$column ?? null;
            } elseif (is_array($item)) {
                $results[] = $item[$column] ?? null;
            }
        }
        return new static($results);
    }

    /**
     * Merge the collection with the given items.
     *
     * @param mixed $items The items to merge with the collection
     * @return static A new collection containing the merged items
     * @since 1.0.0
     */
    public function merge($items)
    {
        return new static(
            array_merge($this->items, $this->get_arrayable_items($items))
        );
    }

    /**
     * Union the collection with the given items.
     *
     * @param mixed $items The items to union with the collection
     * @return static A new collection containing the union of items
     * @since 1.0.0
     */
    public function union($items)
    {
        return new static(
            $this->items + $this->get_arrayable_items($items)
        );
    }

    /**
     * Return a new collection containing only the specified keys.
     *
     * @param mixed $keys The keys to keep
     * @return static A new collection containing only the specified keys
     * 
     * @throws InvalidArgumentException If no keys are passed
     * @since 1.0.0
     */
    public function only($keys)
    {
        if (empty($keys)) {
            throw new InvalidArgumentException('You must pass at least one key to the only method.');
        }

        $keys = is_array($keys) ? $keys : func_get_args();

        return new static(Arr::only($this->items, $keys));
    }

    /**
     * Sort the collection items.
     *
     * @param callable $callback The callback to sort the items
     * @return static A new collection containing the sorted items
     * @since 1.0.0
     */
    public function sort($callback = null)
    {
        $items = $this->items;

        $callback && is_callable($callback)
            ? uasort($items, $callback)
            : asort($items, $callback ?? SORT_REGULAR);

        return new static($items);
    }

    /**
     * Sum the collection items.
     *
     * @param callable $callback The callback to sum the items
     * @return int The sum of the items
     * @since 1.0.0
     */
    public function sum($callback = null)
    {
        if (empty($callback)) {
            return array_sum($this->get_arrayable_items($this->items));
        }

        return array_reduce($this->items, function ($sum, $item) use ($callback) {
            return $sum + $callback($item);
        }, 0);
    }

    /**
     * Calculate the average of the collection items.
     *
     * @param callable $callback The callback to calculate the average
     * @return float The average of the items
     * @since 1.0.0
     */
    public function average($callback = null)
    {
        return $this->sum($callback) / $this->count();
    }

    /**
     * Calculate the average of the collection items.
     *
     * @param callable $callback The callback to calculate the average
     * @return float The average of the items
     * @since 1.0.0
     */
    public function avg($callback = null)
    {
        return $this->average($callback);
    }

    /**
     * Find the minimum value in the collection.
     *
     * @param callable $callback The callback to find the minimum value
     * @return mixed The minimum value
     * @since 1.0.0
     */
    public function min($callback = null)
    {
        return $callback
            ? min(array_map($callback, $this->items))
            : min($this->get_arrayable_items($this->items));
    }

    /**
     * Find the maximum value in the collection.
     *
     * @param callable $callback The callback to find the maximum value
     * @return mixed The maximum value
     * @since 1.0.0
     */
    public function max($callback = null)
    {
        return $callback
            ? max(array_map($callback, $this->items))
            : max($this->get_arrayable_items($this->items));
    }

    /**
     * Calculate the percentage of items that satisfy a given condition.
     *
     * @param callable $callback The callback to calculate the percentage
     * @param int $precision The number of decimal places to round to
     * @return float|null The percentage of items that satisfy the condition
     * 
     * @since 1.0.0
     */
    public function percentage(callable $callback, int $precision = 2)
    {
        if ($this->is_empty()) {
            return null;
        }

        return round(
            $this->filter($callback)->count() / $this->count() * 100,
            $precision
        );
    }

    /**
     * Join the collection items into a string using a glue.
     *
     * @param string $glue The glue to join the items with
     * @return string The joined string
     * @since 1.0.0
     */
    public function join(string $glue = ',')
    {
        return implode($glue, $this->items);
    }

    /**
     * Eager load the relationships for the collection.
     *
     * @param mixed $relations The relations to eager load
     * @return static A new collection containing the eager loaded items
     * @since 1.0.0
     */
    public function load($relations)
    {
        if ($this->is_not_empty()) {
            $query = $this->first()->new_query_without_relations()->with(
                is_string($relations) ? func_get_args() : $relations
            );

            $this->items = $query->eager_load_relations($this->items);
        }

        return $this;
    }

    /**
     * Convert the collection to an array.
     *
     * @return array The array representation of the collection
     * @since 1.0.0
     */
    public function to_array()
    {
        return $this->map(fn($item) => $item instanceof Arrayable ? $item->to_array() : $item)->all();
    }

    /**
     * Convert the collection into a JSON string.
     * This is an alias of the toJson method for following wordpress convention.
     *
     * @return string The JSON-encoded representation of the items
     * @since 1.0.0
     */
    public function to_json($options = 0)
    {
        return Arr::json_encode($this->jsonSerialize(), $options);
    }

    /**
     * Determine if an offset exists in the collection.
     *
     * Part of the ArrayAccess contract. This checks whether an index is set in
     * the internal array and returns a boolean accordingly.
     *
     * @param mixed $offset The array index to check for existence
     * @return bool True when the offset exists; false otherwise
     * @since 1.0.0
     */
    public function offsetExists($offset): bool
    {
        return isset($this->items[$offset]);
    }

    /**
     * Retrieve the value at the given offset.
     *
     * Returns null when the offset is not present. This enables array-like
     * access to collection items while keeping behavior predictable.
     *
     * @param mixed $offset The array index to retrieve
     * @return mixed The value at the offset or null if not set
     * @since 1.0.0
     */
    #[\ReturnTypeWillChange]
    public function offsetGet($offset)
    {
        return $this->items[$offset] ?? null;
    }

    /**
     * Set the value at the given offset.
     *
     * When the offset is null, the value is appended to the end of the list.
     * This fulfills the ArrayAccess interface for write operations.
     *
     * @param mixed $offset The index to set, or null to append
     * @param mixed $value The value to assign at the offset
     * @return void No return value
     * @since 1.0.0
     */
    public function offsetSet($offset, $value): void
    {
        if ($offset === null) {
            $this->items[] = $value;
        } else {
            $this->items[$offset] = $value;
        }
    }

    /**
     * Unset the value at the given offset.
     *
     * Removes the key from the internal array if present. This supports the
     * ArrayAccess interface for deletion semantics.
     *
     * @param mixed $offset The index to remove from the collection
     * @return void No return value
     * @since 1.0.0
     */
    public function offsetUnset($offset): void
    {
        unset($this->items[$offset]);
    }

    /**
     * Get the current item during iteration.
     *
     * Implements Iterator by returning the item at the internal pointer's
     * current position. This is used by foreach and manual iteration.
     *
     * @return mixed The current item at the iterator position
     * @since 1.0.0
     */
    #[\ReturnTypeWillChange]
    public function current()
    {
        return $this->items[$this->position];
    }

    /**
     * Convert the collection to a JSON serializable array.
     *
     * @return mixed The JSON serializable array
     * @since 1.0.0
     */
    #[\ReturnTypeWillChange]
    public function jsonSerialize()
    {
        return array_map(function ($value) {
            switch (true) {
                case $value instanceof JsonSerializable:
                    return $value->jsonSerialize();
                case $value instanceof Jsonable:
                    return json_decode($value->to_json(), true);
                case $value instanceof Arrayable:
                    return $value->to_array();
                default:
                    return $value;
            }
        }, $this->all());
    }

    /**
     * Get the key of the current iterator position.
     *
     * Returns the numerical position index used internally by the iterator
     * implementation. Useful when keys are significant during traversal.
     *
     * @return mixed The current iterator key
     * @since 1.0.0
     */
    #[\ReturnTypeWillChange]
    public function key()
    {
        return $this->position;
    }

    /**
     * Advance the iterator to the next position.
     *
     * Increments the internal position counter by one. Part of the Iterator
     * interface contract to enable standard iteration semantics.
     *
     * @return void No return value
     * @since 1.0.0
     */
    public function next(): void
    {
        ++$this->position;
    }

    /**
     * Rewind the iterator back to the first position.
     *
     * Resets the internal pointer to the beginning so that iteration can be
     * restarted or reused by consumers expecting fresh traversal.
     *
     * @return void No return value
     * @since 1.0.0
     */
    public function rewind(): void
    {
        $this->position = 0;
    }

    /**
     * Determine if the current iterator position is valid.
     *
     * Checks whether the position maps to an existing item within the array.
     * This informs iteration whether to continue or terminate.
     *
     * @return bool True when a current item exists; false otherwise
     * @since 1.0.0
     */
    public function valid(): bool
    {
        return isset($this->items[$this->position]);
    }
}
