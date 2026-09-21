<?php

namespace Kirki\Ecommerce\App\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

/**
 * Applies whitelisted list sorting to a query from the request's sort filters.
 *
 * @since 1.0.0
 */
trait HasSortableColumns
{
    /**
     * Get the field this resource orders by when the request names none it accepts.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function default_sort_by()
    {
        return 'id';
    }

    /**
     * Get the direction this resource orders by when the request names none it accepts.
     *
     * @since 1.0.0
     *
     * @return string Either 'asc' or 'desc'.
     */
    protected function default_sort_order()
    {
        return 'desc';
    }

    /**
     * Get the sort fields this resource accepts, mapped to what the database orders by.
     *
     * A value is either the name of a stored column, the alias of a value the list
     * query already selects (such as a relation aggregate), or a callable receiving
     * the resolved direction and returning anything order_by() accepts — which is
     * how a value held on a related record becomes sortable.
     *
     * This map is the sole authority on what may be sorted by; a field absent from
     * it is not accepted.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    abstract protected function sortable_columns();

    /**
     * Order the list query by the requested field, falling back to this resource's
     * default when the field is not one it accepts.
     *
     * @since 1.0.0
     *
     * @param QueryBuilder  $query   Query to order.
     * @param ListFilterDTO $filters Request filters carrying the sort field and direction.
     * @return QueryBuilder The ordered query.
     */
    protected function apply_sorting(QueryBuilder $query, ListFilterDTO $filters)
    {
        $columns = $this->sortable_columns();
        $sort_by = $filters->sort_by;

        if (!is_string($sort_by) || !array_key_exists($sort_by, $columns)) {
            $sort_by = $this->default_sort_by();
        }

        $direction = $this->resolve_sort_order($filters->sort_order);
        $column = array_key_exists($sort_by, $columns) ? $columns[$sort_by] : $sort_by;

        if (is_callable($column)) {
            $column = $column($direction);
        }

        return $query->order_by($column, $direction);
    }

    /**
     * Constrain the requested direction to one the query builder accepts.
     *
     * order_by() throws on anything but asc or desc, and the direction reaches it
     * straight from the request, so an unrecognised value falls back rather than
     * failing the request.
     *
     * @since 1.0.0
     *
     * @param mixed $sort_order Direction as received from the request.
     * @return string Either 'asc' or 'desc'.
     */
    protected function resolve_sort_order($sort_order)
    {
        if (!is_string($sort_order)) {
            return $this->default_sort_order();
        }

        $direction = strtolower($sort_order);

        if (!in_array($direction, ['asc', 'desc'], true)) {
            return $this->default_sort_order();
        }

        return $direction;
    }
}
