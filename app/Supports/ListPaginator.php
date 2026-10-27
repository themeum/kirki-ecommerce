<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

/**
 * A paginator that also reports if the table holds any record at all.
 *
 * `has_records` ignores the search and filters of the request, so a list page can tell
 * an empty table from a search that matched nothing.
 *
 * @since 1.0.0
 */
class ListPaginator extends Paginator
{
    /** @var bool */
    protected $has_records = false;

    /**
     * Create a list paginator from a finished paginator.
     *
     * A query is run with exists() only when the page total is 0. When the page has
     * rows, the table is known to hold records and no extra query runs. Pass a fresh,
     * unfiltered query, never the filtered list query, or the flag would mean
     * "has a match" instead of "has any record".
     *
     * @since 1.0.0
     *
     * @param Paginator         $paginator   The paginator to convert.
     * @param bool|QueryBuilder $has_records Whether the table holds a record, or the query that tells.
     * @return static
     */
    public static function from(Paginator $paginator, $has_records)
    {
        $list = new static(
            $paginator->items(),
            $paginator->total(),
            $paginator->get_per_page(),
            $paginator->get_current_page()
        );

        if ($has_records instanceof QueryBuilder) {
            $has_records = $paginator->total() > 0 || $has_records->exists();
        }

        $list->has_records = (bool) $has_records;

        return $list;
    }

    /**
     * Convert the paginator to an array, with the record presence flag.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function to_array()
    {
        return array_merge(parent::to_array(), ['has_records' => $this->has_records]);
    }
}
