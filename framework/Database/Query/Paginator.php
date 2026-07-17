<?php

namespace Kirki\Ecommerce\Database\Query;

use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Contracts\Support\Jsonable;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Supports\Arr;

/**
 * Represent a paginated slice of results with metadata.
 *
 * Wrap a collection of items and expose helpful pagination helpers such as
 * current page, last page, and range indices. Typically constructed by the
 * query builder when using paginate to return both data and context.
 *
 * @since 1.0.0
 */
class Paginator implements Arrayable, Jsonable
{
    /**
     * The collection of items for the current page.
     *
     * @var Collection
     */
    protected $items;

    /**
     * The total number of matching records across all pages.
     *
     * @var int
     */
    protected $total;

    /**
     * The number of items displayed per page.
     *
     * @var int
     */
    protected $per_page;

    /**
     * The current page number (1-based index).
     *
     * @var int
     */
    protected $current_page;

    /**
     * The last page number, calculated from total and per_page.
     *
     * @var int
     */
    protected $last_page;

    /**
     * Create a new paginator instance from items and counts.
     *
     * Accepts the current page's items and the total count to compute page
     * numbers and boundaries. The last page is derived by dividing total by
     * per-page and rounding up to the nearest integer.
     *
     * @param Collection $items The items for the current page
     * @param int $total The total number of matching records
     * @param int $per_page The number of items per page
     * @param int $current_page The current page number (1-based)
     * @return void No return value
     * @since 1.0.0
     */
    public function __construct(Collection $items, $total, $per_page, $current_page)
    {
        $this->items = $items;
        $this->total = (int) $total;
        $this->per_page = (int) $per_page;
        $this->current_page = (int) $current_page;
        $this->last_page = $this->total > 0 ? (int) ceil($this->total / $this->per_page) : $this->current_page;
    }

    /**
     * Get the collection of items for the current page.
     *
     * Returns the items as a collection to support further transformations or
     * serialization by callers.
     *
     * @return Collection The items contained in this paginator page
     * @since 1.0.0
     */
    public function items()
    {
        return $this->items;
    }

    /**
     * Get the total number of matching records.
     *
     * Represents the count across all pages, not just the current slice of
     * items returned.
     *
     * @return int The total number of records
     * @since 1.0.0
     */
    public function total()
    {
        return $this->total;
    }

    /**
     * Get the per-page size for this pagination context.
     *
     * Reflects the limit applied when the paginator was constructed and used
     * to compute page counts and range indices.
     *
     * @return int The number of items per page
     * @since 1.0.0
     */
    public function get_per_page()
    {
        return $this->per_page;
    }

    /**
     * Get the current page number.
     *
     * This value is 1-based and corresponds to the offset and limit used when
     * fetching the current slice of results.
     *
     * @return int The current page number
     * @since 1.0.0
     */
    public function get_current_page()
    {
        return $this->current_page;
    }

    /**
     * Get the last page number based on total and per-page.
     *
     * Calculated by dividing total by per-page and rounding up. Represents the
     * upper bound for valid page navigation.
     *
     * @return int The highest page number available
     * @since 1.0.0
     */
    public function get_last_page()
    {
        return $this->last_page;
    }

    /**
     * Determine if more pages are available after the current page.
     *
     * Compares the current page to the last page to signal whether forward
     * navigation is possible.
     *
     * @return bool True when there are additional pages; false otherwise
     * @since 1.0.0
     */
    public function has_more_page()
    {
        return $this->current_page < $this->last_page;
    }

    /**
     * Determine if pagination spans more than one page.
     *
     * Returns true when not on the first page or when more pages exist. This
     * is useful for conditionally rendering pagination controls.
     *
     * @return bool True when multiple pages exist; false for a single page
     * @since 1.0.0
     */
    public function has_pages()
    {
        return $this->current_page !== 1 || $this->has_more_page();
    }

    /**
     * Determine if the paginator is on the first page.
     *
     * Useful for disabling previous navigation controls in UIs.
     *
     * @return bool True when on page 1; false otherwise
     * @since 1.0.0
     */
    public function on_first_page()
    {
        return $this->current_page === 1;
    }

    /**
     * Determine if the paginator is on the last page.
     *
     * Useful for disabling next navigation controls in UIs.
     *
     * @return bool True when on the last page; false otherwise
     * @since 1.0.0
     */
    public function on_last_page()
    {
        return $this->current_page === $this->last_page;
    }

    /**
     * Get the index (1-based) of the first item on the current page.
     *
     * Returns null when there are no items in the result set. Calculated from
     * current page and per-page values.
     *
     * @return int|null The starting item index or null when empty
     * @since 1.0.0
     */
    public function first_item()
    {
        return $this->total > 0 ? ($this->current_page - 1) * $this->per_page + 1 : null;
    }

    /**
     * Get the index (1-based) of the last item on the current page.
     *
     * Returns null when there are no items. Computed as first item index plus
     * the number of items in the current page minus one.
     *
     * @return int|null The ending item index or null when empty
     * @since 1.0.0
     */
    public function last_item()
    {
        return $this->total > 0 ? $this->first_item() + $this->items->count() - 1 : null;
    }

    /**
     * Convert the paginator to an array including items and metadata.
     *
     * Returns an associative array describing the current slice, total, page
     * counts, range, and flags commonly used by consumers to render controls.
     *
     * @return array The array representation of the paginator
     * @since 1.0.0
     */
    public function to_array()
    {
        return [
            'results' => $this->items->all(),
            'total' => $this->total,
            'count' => $this->items->count(),
            'per_page' => $this->per_page,
            'current_page' => $this->current_page,
            'last_page' => $this->last_page,
            'from' => $this->first_item(),
            'to' => $this->last_item(),
            'has_more_pages' => $this->has_more_page(),
        ];
    }

    /**
     * Convert the paginator to a JSON string.
     *
     * Encodes the array form of the paginator for straightforward transport or
     * logging purposes.
     *
     * @return string The JSON-encoded paginator representation
     * @since 1.0.0
     */
    public function to_json($options = 0)
    {
        return Arr::json_encode($this->to_array(), $options);
    }
}
