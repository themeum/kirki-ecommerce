<?php

namespace Kirki\Ecommerce\App\Traits;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

use function Kirki\Ecommerce\App\to_utc_datetime_string;

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
                    return $query->where_between($column, [to_utc_datetime_string($from_date), to_utc_datetime_string($to_date)]);
                }

                return $query->where($column, '>=', to_utc_datetime_string($from_date));
            }
        });
    }
}
