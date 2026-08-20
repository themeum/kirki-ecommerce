<?php

namespace Kirki\Ecommerce\App\Traits;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

trait HasDateRangeFilter
{

    /**
     * Filter by datetime range
     * 
     * @param QueryBuilder $query
     * @param string $from_date
     * @param string $to_date
     * @param string $column
     * @return QueryBuilder
     */
    public function scope_filter_with_datetime_range(QueryBuilder $query, $from_date, $to_date, $column = 'created_at')
    {
        return $query->when(!empty($from_date), function (QueryBuilder $query) use ($from_date, $to_date, $column) {
            if (!empty($from_date)) {
                if (!empty($to_date)) {
                    return $query->where_between($column, [Date::parse($from_date, 'UTC')->to_date_time_string(), Date::parse($to_date, 'UTC')->to_date_time_string()]);
                }

                return $query->where($column, '>=', Date::parse($from_date, 'UTC')->to_date_time_string());
            }
        });
    }
}
