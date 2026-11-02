<?php

namespace Kirki\Ecommerce\App\Traits;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

/**
 * Query scope for filtering a model by a calendar-day range on a datetime column.
 *
 * @since 1.0.0
 */
trait HasDateRangeFilter
{

    /**
     * Filter by datetime range.
     *
     * Both bounds are optional and independent. The dates arrive as plain
     * calendar days in the site timezone, so the range is widened to cover the
     * whole of both days before being converted to the UTC values stored in
     * the column.
     *
     * @since 1.0.0
     *
     * @param QueryBuilder $query     Query being scoped.
     * @param string|null  $from_date Start day, or empty for no lower bound.
     * @param string|null  $to_date   End day, or empty for no upper bound.
     * @param string       $column    Datetime column to filter on.
     * @return QueryBuilder
     */
    public function scope_filter_with_datetime_range(QueryBuilder $query, $from_date, $to_date, $column = 'created_at')
    {
        return $query
            ->when(!empty($from_date), function (QueryBuilder $query) use ($from_date, $column) {
                return $query->where($column, '>=', Date::parse($from_date)->start_of_day()->set_timezone('UTC')->to_date_time_string());
            })
            ->when(!empty($to_date), function (QueryBuilder $query) use ($to_date, $column) {
                return $query->where($column, '<=', Date::parse($to_date)->end_of_day()->set_timezone('UTC')->to_date_time_string());
            });
    }
}
