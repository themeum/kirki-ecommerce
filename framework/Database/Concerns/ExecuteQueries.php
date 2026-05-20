<?php

namespace Kirki\Ecommerce\Database\Concerns;

use Closure;
use Kirki\Ecommerce\Collections\Collection;
use InvalidArgumentException;
use RuntimeException;

use function Kirki\Ecommerce\collection;

/**
 * Execute queries and return the results.
 *
 * This trait provides methods for executing queries and returning the results.
 * It is used to execute queries and return the results in a consistent manner.
 *
 * @since 1.0.0
 */
trait ExecuteQueries
{
    /**
     * Chunk the results of the query into a set of smaller collections.
     *
     * @param int $count The number of items to include in each chunk
     * @param Closure $callback The callback to execute for each chunk
     * @return bool True if the callback returns true for all chunks, false otherwise
     */
    public function chunk(int $count, Closure $callback): bool
    {
        $this->enforce_order_by_primary_key();

        $skip = $this->get_offset();
        $remaining = $this->get_limit();

        $page = 1;

        do {
            $offset = (($page - 1) * $count) + intval($skip);
            $limit = is_null($remaining) ? $count : min($count, $remaining);

            if ($limit === 0) {
                break;
            }

            $results = $this->offset($offset)->limit($limit)->get();
            $result_count = $results->count();

            if ($result_count === 0) {
                break;
            }

            if (!is_null($remaining)) {
                $remaining = max($remaining - $result_count, 0);
            }

            if ($callback($results, $page) === false) {
                return false;
            }

            unset($results);

            $page++;
        } while ($count === $result_count);

        return true;
    }

    /**
     * Chunk the results of the query into a set of smaller collections and map the results using a callback.
     *
     * @param Closure $callback The callback to execute for each chunk
     * @param int $count The number of items to include in each chunk
     * @return Collection A new collection of mapped results
     * @since 1.0.0
     */
    public function chunk_map(Closure $callback, $count = 1000)
    {
        $collection = collection();

        $this->chunk($count, function ($results) use ($callback, $collection) {
            $results->each(function ($result) use ($callback, $collection) {
                $collection->push($callback($result));
            });
        });

        return $collection;
    }

    /**
     * Iterate over the results of the query and execute a callback for each result.
     *
     * @param Closure $callback The callback to execute for each result
     * @param int $count The number of items to include in each chunk
     * @return bool True if the callback returns true for all results, false otherwise
     */
    public function each(Closure $callback, int $count = 1000)
    {
        return $this->chunk($count, function ($results) use ($callback) {
            foreach ($results as $key => $result) {
                if ($callback($result, $key) === false) {
                    return false;
                }
            }
        });
    }

    /**
     * Chunk the results of the query into a set of smaller collections by the given column in ascending order.
     *
     * @param int $count The number of items to include in each chunk
     * @param Closure $callback The callback to execute for each chunk
     * @param string $column The column to chunk by
     * @param string $alias The alias of the column
     * @return bool True if the callback returns true for all chunks, false otherwise
     */
    public function chunk_by_id(int $count, Closure $callback, $column = null, $alias = null)
    {
        return $this->ordered_chunk_by_id($count, $callback, $column, $alias);
    }

    /**
     * Chunk the results of the query into a set of smaller collections by the given column in descending order.
     *
     * @param int $count The number of items to include in each chunk
     * @param Closure $callback The callback to execute for each chunk
     * @param string $column The column to chunk by
     * @param string $alias The alias of the column
     * @return bool True if the callback returns true for all chunks, false otherwise
     */
    public function chunk_by_id_desc(int $count, Closure $callback, $column = null, $alias = null)
    {
        return $this->ordered_chunk_by_id($count, $callback, $column, $alias, true);
    }

    /**
     * Chunk the results of the query into a set of smaller collections by the given column in the given order.
     *
     * @param int $count The number of items to include in each chunk
     * @param Closure $callback The callback to execute for each chunk
     * @param string $column The column to chunk by
     * @param string $alias The alias of the column
     * @param bool $descending The order to chunk by
     * @return bool True if the callback returns true for all chunks, false otherwise
     */
    public function ordered_chunk_by_id(int $count, Closure $callback, $column = null, $alias = null, $descending = false)
    {
        $column ??= $this->default_key_name();
        $alias ??= $column;
        $last_id = null;
        $skip = $this->get_offset();
        $remaining = $this->get_limit();

        $page = 1;

        do {

            $clone = clone $this;

            if ($skip && $page > 1) {
                $clone->offset(0);
            }

            $limit = is_null($remaining) ? $count : min($count, $remaining);

            if ($limit === 0) {
                break;
            }

            if ($descending) {
                $results = $clone->for_page_before_id($count, $last_id, $column)->get();
            } else {
                $results = $clone->for_page_after_id($count, $last_id, $column)->get();
            }

            $result_count = $results->count();

            if ($result_count === 0) {
                break;
            }

            if (!is_null($remaining)) {
                $remaining = max($remaining - $result_count, 0);
            }

            if ($callback($results, $page) === false) {
                return false;
            }

            $last_result = $results->last();

            $last_id = is_null($last_result) ? null : $last_result[$alias];

            if (is_null($last_id)) {
                throw new RuntimeException('No more results found');
            }

            unset($results);

            $page++;
        } while ($count === $result_count);

        return true;
    }

    /**
     * Lazily iterate over the results of the query.
     *
     * @param int $chunk_size The number of items to include in each chunk
     * @return \Generator
     * @since 1.0.0
     */
    public function lazy($chunk_size = 1000)
    {
        if ($chunk_size < 1) {
            throw new InvalidArgumentException('Chunk size should be at least 1');
        }

        $this->enforce_order_by_primary_key();

        $page = 1;

        while (true) {
            $results = $this->for_page($page++, $chunk_size)->get();

            foreach ($results as $result) {
                yield $result;
            }

            if ($results->count() < $chunk_size) {
                return;
            }
        }
    }

    /**
     * Lazily iterate over the results of the query by the given column in ascending order.
     *
     * @param int $chunk_size The number of items to include in each chunk
     * @param string $column The column to iterate by
     * @param string $alias The alias of the column
     *
     * @return \Generator
     *
     * @since 1.0.0
     */
    public function lazy_by_id($chunk_size = 1000, $column = null, $alias = null)
    {
        return $this->ordered_lazy_by_id($chunk_size, $column, $alias);
    }

    /**
     * Lazily iterate over the results of the query by the given column in descending order.
     *
     * @param int $chunk_size The number of items to include in each chunk
     * @param string $column The column to iterate by
     * @param string $alias The alias of the column
     *
     * @return \Generator
     *
     * @since 1.0.0
     */
    public function lazy_by_id_desc($chunk_size = 1000, $column = null, $alias = null)
    {
        return $this->ordered_lazy_by_id($chunk_size, $column, $alias, true);
    }

    /**
     * Lazily iterate over the results of the query by the given column in the given order.
     *
     * @param int $chunk_size The number of items to include in each chunk
     * @param string $column The column to iterate by
     * @param string $alias The alias of the column
     * @param bool $descending The order to iterate by
     * @return \Generator
     * @since 1.0.0
     */
    public function ordered_lazy_by_id($chunk_size = 1000, $column = null, $alias = null, $descending = false)
    {
        if ($chunk_size < 1) {
            throw new InvalidArgumentException('Chunk size should be at least 1');
        }

        $column ??= $this->default_key_name();
        $alias ??= $column;

        $last_id = null;

        while (true) {
            $clone = clone $this;

            if ($descending) {
                $results = $clone->for_page_before_id($chunk_size, $last_id, $column)->get();
            } else {
                $results = $clone->for_page_after_id($chunk_size, $last_id, $column)->get();
            }

            foreach ($results as $result) {
                yield $result;
            }

            if ($results->count() < $chunk_size) {
                return;
            }

            $last_id = $results->last()[$alias];

            if (is_null($last_id)) {
                throw new RuntimeException('The lazy_by_id operation was aborted.');
            }
        }
    }

    /**
     * Call the given Closure with the given value.
     *
     * @param  \Closure  $callback
     * @return $this
     */
    public function tap($callback)
    {
        $callback($this);

        return $this;
    }
}
