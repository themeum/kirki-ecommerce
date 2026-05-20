<?php

namespace Kirki\Ecommerce\Database\Query;

use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Connection\Connection;
use Kirki\Ecommerce\Supports\Arr;

use function Kirki\Ecommerce\collection;

class QueryCompiler
{

    /**
     * The database connection instance used to execute queries.
     *
     * @var \Ecommerce\Database\Connection\Connection
     */
    protected $connection;

    /**
     * Initialize a new QueryCompiler instance with a database connection.
     *
     * @param Connection $connection The database connection instance.
     *
     * @return void
     */
    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * The components of the query to compile.
     *
     * @var array
     */
    protected $components = [
        'aggregate',
        'columns',
        'from',
        'joins',
        'wheres',
        'groups',
        'havings',
        'orders',
        'limit',
        'offset',
    ];

    /**
     * Get the mysql safe datetime format string.
     *
     * @return string
     */
    public function get_date_format()
    {
        return 'Y-m-d H:i:s';
    }

    /**
     * Compile the insert query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $values The values to insert.
     *
     * @return string The compiled insert query.
     */
    public function compile_insert(QueryBuilder $query, array $values)
    {
        $table = $this->wrap_table($query->from);

        if (empty($values)) {
            return sprintf('insert into %s default values', $table);
        }

        if (!is_array(reset($values))) {
            $values = [$values];
        }

        $columns = $this->columnize(array_keys(reset($values)));

        $parameters = collection($values)
            ->map(fn($record) => sprintf('(%s)', $this->parameterize($record)))
            ->join(', ');

        return sprintf('insert into %s (%s) values %s', $table, $columns, $parameters);
    }

    /**
     * Compile the update query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $values The values to update.
     *
     * @return string The compiled update query.
     */
    public function compile_update(QueryBuilder $query, array $values)
    {
        $table = $this->wrap_table($query->from);
        $columns = $this->compile_update_columns($query, $values);
        $where = $this->compile_wheres($query);

        return trim(
            isset($query->joins)
                ? $this->compile_update_with_joins($query, $table, $columns, $where)
                : $this->compile_update_without_joins($query, $table, $columns, $where)
        );
    }

    /**
     * Compile the update columns query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $values The values to update.
     *
     * @return string The compiled update columns query.
     */
    protected function compile_update_columns(QueryBuilder $query, array $values)
    {
        return collection($values)
            ->map(fn($value, $key) => $this->wrap($key) . ' = ' . $this->parameter($value))
            ->join(', ');
    }

    /**
     * Compile the update with joins query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param string $table The table name.
     * @param string $columns The columns to update.
     * @param string $where The where clause.
     *
     * @return string The compiled update with joins query.
     */
    protected function compile_update_with_joins(QueryBuilder $query, $table, $columns, $where)
    {
        $joins = $this->compile_joins($query, $query->joins);

        return sprintf(
            'update %s %s set %s %s',
            $table,
            $joins,
            $columns,
            $where
        );
    }

    /**
     * Compile the update without joins query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param string $table The table name.
     * @param string $columns The columns to update.
     * @param string $where The where clause.
     *
     * @return string The compiled update without joins query.
     */
    protected function compile_update_without_joins(QueryBuilder $query, $table, $columns, $where)
    {
        $sql = sprintf(
            'update %s set %s %s',
            $table,
            $columns,
            $where
        );

        if (!empty($query->orders)) {
            $sql .= ' ' . $this->compile_orders($query, $query->orders);
        }

        if (!empty($query->limit)) {
            $sql .= ' ' . $this->compile_limit($query, $query->limit);
        }

        return $sql;
    }

    /**
     * Compile the delete query.
     *
     * @param QueryBuilder $query The query builder instance.
     *
     * @return string The compiled delete query.
     */
    public function compile_delete(QueryBuilder $query)
    {
        $table = $this->wrap_table($query->from);
        $where = $this->compile_wheres($query);

        return trim(
            isset($query->joins)
                ? $this->compile_delete_with_joins($query, $table, $where)
                : $this->compile_delete_without_joins($query, $table, $where)
        );
    }


    /**
     * Compile the delete with joins query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param string $table The table name.
     * @param string $where The where clause.
     *
     * @return string The compiled delete with joins query.
     */
    protected function compile_delete_with_joins(QueryBuilder $query, $table, $where)
    {
        $alias = end(explode(' as ', $table));

        $joins = $this->compile_joins($query, $query->joins);

        return sprintf(
            'delete %s from %s %s %s',
            $alias,
            $table,
            $joins,
            $where
        );
    }

    /**
     * Compile the delete without joins query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param string $table The table name.
     * @param string $where The where clause.
     *
     * @return string The compiled delete without joins query.
     */
    protected function compile_delete_without_joins(QueryBuilder $query, $table, $where)
    {
        return sprintf(
            'delete from %s %s',
            $table,
            $where
        );
    }

    /**
     * Compile the select query.
     *
     * @param QueryBuilder $query The query builder instance.
     *
     * @return string The compiled select query.
     */
    public function compile_select(QueryBuilder $query)
    {
        $original = $query->columns;

        if (is_null($query->columns)) {
            $query->columns = ['*'];
        }

        $sql = trim(
            $this->concatenate(
                $this->compile_components($query)
            )
        );

        $query->columns = $original;

        return $sql;
    }

    /**
     * Compile the components of the query.
     *
     * @param QueryBuilder $query The query builder instance.
     *
     * @return array The compiled components.
     */
    protected function compile_components(QueryBuilder $query)
    {
        $sql = [];

        foreach ($this->components as $component) {
            if (isset($query->$component)) {
                $method = 'compile_' . $component;

                $sql[$component] = $this->$method($query, $query->$component);
            }
        }

        return $sql;
    }

    /**
     * Concatenate the segments.
     *
     * @param array $segments The segments to concatenate.
     *
     * @return string The concatenated segments.
     */
    protected function concatenate($segments)
    {
        return implode(' ', array_filter($segments, function ($value) {
            return (string) $value !== '';
        }));
    }

    /**
     * Compile the aggregate query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $aggregate The aggregate query.
     *
     * @return string The compiled aggregate query.
     */
    protected function compile_aggregate(QueryBuilder $query, $aggregate)
    {
        $column = $this->columnize($aggregate['columns']);

        if (is_array($query->distinct)) {
            $column = 'distinct ' . $this->columnize($query->distinct);
        } elseif ($query->distinct && $column !== '*') {
            $column = 'distinct ' . $column;
        }

        return sprintf(
            'select %s(%s) as aggregate',
            $aggregate['function'],
            $column
        );
    }

    /**
     * Compile the columns query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $columns The columns query.
     *
     * @return string|null The compiled columns query.
     */
    protected function compile_columns(QueryBuilder $query, $columns)
    {
        if (!is_null($query->aggregate)) {
            return;
        }

        $select = '';

        if ($query->distinct) {
            $select = 'select distinct ';
        } else {
            $select = 'select ';
        }

        return $select . $this->columnize($columns);
    }

    /**
     * Compile the from query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $table The table query.
     *
     * @return string The compiled from query.
     */
    protected function compile_from(QueryBuilder $query, $table)
    {
        return 'from ' . $this->wrap_table($table);
    }

    /**
     * Compile the joins query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $joins The joins query.
     *
     * @return string The compiled joins query.
     */
    protected function compile_joins(QueryBuilder $query, $joins)
    {
        return collection($joins)->map(function ($join) use ($query) {
            $table = $this->wrap_table($join->table);

            $nested_joins = is_null($join->joins) ? '' : ' ' . $this->compile_joins($query, $join->joins);
            $table_and_nested_joins = is_null($join->joins) ? $table : sprintf('(%s%s)', $table, $nested_joins);

            return trim(
                sprintf(
                    '%s join %s %s',
                    $join->type,
                    $table_and_nested_joins,
                    $this->compile_wheres($join)
                )
            );
        })->join(' ');
    }

    /**
     * Compile the wheres query.
     *
     * @param QueryBuilder $query The query builder instance.
     *
     * @return string The compiled wheres query.
     */
    protected function compile_wheres(QueryBuilder $query)
    {
        if (is_null($query->wheres)) {
            return '';
        }

        $sql = $this->compile_wheres_to_array($query);

        if (count($sql) > 0) {
            return $this->concatenate_where_clauses($query, $sql);
        }

        return '';
    }

    /**
     * Compile the wheres to array query.
     *
     * @param QueryBuilder $query The query builder instance.
     *
     * @return array The compiled wheres to array query.
     */
    protected function compile_wheres_to_array(QueryBuilder $query)
    {
        return array_map(function ($where) use ($query) {
            $boolean = $where['boolean'];
            $method = 'where_' . $where['type'];

            return sprintf('%s %s', $boolean, $this->$method($query, $where));
        }, $query->wheres);
    }

    /**
     * Concatenate the where clauses.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $sql The where clauses.
     *
     * @return string The concatenated where clauses.
     */
    protected function concatenate_where_clauses($query, $sql)
    {
        $conjunction = $query instanceof JoinClause ? 'on' : 'where';

        return sprintf(
            '%s %s',
            $conjunction,
            $this->remove_leading_boolean(implode(' ', $sql))
        );
    }

    /**
     * Remove the leading boolean.
     *
     * @param string $value The value to remove the leading boolean from.
     *
     * @return string The value with the leading boolean removed.
     */
    protected function remove_leading_boolean($value)
    {
        return preg_replace('/and |or /i', '', $value, 1);
    }

    /**
     * Compile the groups query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $groups The groups query.
     *
     * @return string The compiled groups query.
     */
    protected function compile_groups(QueryBuilder $query, $groups)
    {
        return 'group by ' . $this->columnize($groups);
    }

    /**
     * Compile the havings query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $havings The havings query.
     *
     * @return string The compiled havings query.
     */
    protected function compile_havings(QueryBuilder $query)
    {
        $sql = $this->remove_leading_boolean(
            collection($query->havings)
                ->map(fn($having) => $having['boolean'] . ' ' . $this->compile_having($having))
                ->join(' ')
        );

        return 'having ' . $sql;
    }

    /**
     * Compile the having query.
     *
     * @param array $having The having query.
     *
     * @return string The compiled having query.
     */
    protected function compile_having($having)
    {
        switch ($having['type']) {
            case 'raw':
                return $having['sql'];
            case 'between':
                return $this->compile_having_between($having);
            case 'null':
                return $this->compile_having_null($having);
            case 'not_null':
                return $this->compile_having_not_null($having);
            case 'expression':
                return $this->compile_having_expression($having);
            case 'nested':
                return $this->compile_nested_havings($having);
            default:
                return $this->compile_having_basic($having);
        }
    }

    /**
     * Compile the having basic query.
     *
     * @param array $having The having query.
     *
     * @return string The compiled having basic query.
     */
    protected function compile_having_basic($having)
    {
        return sprintf(
            '%s %s %s',
            $this->wrap($having['column']),
            $having['operator'],
            $this->parameter($having['value'])
        );
    }

    /**
     * Compile the nested havings query.
     *
     * @param array $having The having query.
     *
     * @return string The compiled nested havings query.
     */
    protected function compile_nested_havings($having)
    {
        return sprintf(
            '(%s)',
            substr($this->compile_havings($having['query']), 7)
        );
    }

    /**
     * Compile the having between query.
     *
     * @param array $having The having query.
     *
     * @return string The compiled having between query.
     */
    protected function compile_having_between($having)
    {
        $between = $having['not'] ? 'not between' : 'between';
        $min = $this->parameter($having['values'][0]);
        $max = $this->parameter($having['values'][1]);

        return sprintf(
            '%s %s %s and %s',
            $this->wrap($having['column']),
            $between,
            $min,
            $max
        );
    }

    /**
     * Compile the having null query.
     *
     * @param array $having The having query.
     *
     * @return string The compiled having null query.
     */
    protected function compile_having_null($having)
    {
        return $this->wrap($having['column']) . ' is null';
    }

    /**
     * Compile the having not null query.
     *
     * @param array $having The having query.
     *
     * @return string The compiled having not null query.
     */
    protected function compile_having_not_null($having)
    {
        return $this->wrap($having['column']) . ' is not null';
    }

    /**
     * Compile the having expression query.
     *
     * @param array $having The having query.
     *
     * @return string The compiled having expression query.
     */
    protected function compile_having_expression($having)
    {
        return $having['column']->get_value($this);
    }

    /**
     * Compile the orders query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array|null $orders The orders query.
     *
     * @return string The compiled orders query.
     */
    protected function compile_orders(QueryBuilder $query, $orders)
    {
        if (empty($orders)) {
            return '';
        }

        return 'order by ' . implode(', ', $this->compile_orders_to_array($query, $orders));
    }

    /**
     * Compile the orders to array query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $orders The orders query.
     *
     * @return array The compiled orders to array query.
     */
    protected function compile_orders_to_array(QueryBuilder $query, $orders)
    {
        return array_map(function ($order) {
            return $order['sql'] ?? sprintf('%s %s', $this->wrap($order['column']), $order['direction']);
        }, $orders);
    }

    /**
     * Compile the limit query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param int $limit The limit query.
     *
     * @return string The compiled limit query.
     */
    protected function compile_limit(QueryBuilder $query, $limit)
    {
        return 'limit ' . (int) $limit;
    }

    /**
     * Compile the offset query.
     *
     * @param QueryBuilder $query The query builder instance.
     * @param array $offset The offset query.
     *
     * @return string The compiled offset query.
     */
    protected function compile_offset(QueryBuilder $query, $offset)
    {
        return 'offset ' . (int) $offset;
    }

    /**
     * Compile the exists query.
     *
     * @param QueryBuilder $query The query builder instance.
     *
     * @return string The compiled exists query.
     */
    public function compile_exists(QueryBuilder $query)
    {
        $select = $this->compile_select($query);

        return sprintf(
            'select exists(%s) as %s',
            $select,
            $this->wrap('exists')
        );
    }

    /**
     * Compile the truncate query.
     *
     * @param QueryBuilder $query The query builder instance.
     *
     * @return string The compiled truncate query.
     */
    public function compile_truncate(QueryBuilder $query)
    {
        return sprintf(
            'truncate table %s',
            $this->wrap_table($query->from)
        );
    }

    /**
     * Compile the columnize query.
     *
     * @param array $columns The columns query.
     *
     * @return string The compiled columnize query.
     */
    public function columnize(array $columns)
    {
        return implode(', ', array_map([$this, 'wrap'], $columns));
    }

    /**
     * Compile the wrap query.
     *
     * @param $value The value query.
     *
     * @return string The compiled wrap query.
     */
    public function wrap($value)
    {
        if ($this->is_expression($value)) {
            return $this->get_value($value);
        }

        if (stripos($value, ' as ') !== false) {
            return $this->wrap_aliased_value($value);
        }

        return $this->wrap_segments(explode('.', $value));
    }

    /**
     * Compile the is expression query.
     *
     * @param array $value The value query.
     *
     * @return string The compiled is expression query.
     */
    public function is_expression($value)
    {
        return $value instanceof Expression;
    }

    /**
     * Compile the get value query.
     *
     * @param $expression The expression query.
     *
     * @return string The compiled get value query.
     */
    public function get_value($expression)
    {
        if ($this->is_expression($expression)) {
            return $this->get_value($expression->get_value());
        }

        return $expression;
    }

    /**
     * Compile the wrap value query.
     *
     * @param $value The value query.
     *
     * @return string The compiled wrap value query.
     */
    public function wrap_value($value)
    {
        return $value === '*' ? $value : '`' . str_replace('`', '``', $value) . '`';
    }

    /**
     * Compile the wrap table query.
     *
     * @param $table The table query.
     *
     * @return string The compiled wrap table query.
     */
    public function wrap_table($table, $prefix = null)
    {
        if ($this->is_expression($table)) {
            return $this->get_value($table);
        }

        $prefix ??= $this->connection->get_table_prefix();

        if (stripos($table, ' as ') !== false) {
            return $this->wrap_aliased_table($table, $prefix);
        }

        return $this->wrap_value($this->connection->get_table_prefix() . $table);
    }

    /**
     * Compile the wrap segments query.
     *
     * @param $segments The segments query.
     *
     * @return string The compiled wrap segments query.
     */
    protected function wrap_segments($segments)
    {
        return collection($segments)->map(
            fn($segment, $key) => $key == 0 && count($segments) > 1
                ? $this->wrap_table($segment)
                : $this->wrap_value($segment)
        )->join('.');
    }

    /**
     * Compile the wrap aliased value query.
     *
     * @param $value The value query.
     *
     * @return string The compiled wrap aliased value query.
     */
    protected function wrap_aliased_value($value)
    {
        $segments = preg_split('/\s+as\s+/i', $value);

        return $this->wrap($segments[0]) . ' as ' . $this->wrap_value($segments[1]);
    }

    /**
     * Compile the wrap aliased table query.
     *
     * @param $table The table query.
     *
     * @return string The compiled wrap aliased table query.
     */
    protected function wrap_aliased_table($table, $prefix = null)
    {
        $segments = preg_split('/\s+as\s+/i', $table);

        $prefix ??= $this->connection->get_table_prefix();

        return sprintf(
            '%s as %s',
            $this->wrap_table($segments[0], $prefix),
            $this->wrap_value(
                $prefix . $segments[1]
            )
        );
    }

    /**
     * Compile the parameter query.
     *
     * @param $value The value query.
     *
     * @return string The compiled parameter query.
     */
    public function parameter($value)
    {
        return $this->is_expression($value)
            ? $this->get_value($value)
            : $this->connection->placeholder($value);
    }

    /**
     * Compile the parameterize query.
     *
     * @param $values The values query.
     *
     * @return string The compiled parameterize query.
     */
    protected function parameterize(array $values)
    {
        return implode(', ', array_map([$this, 'parameter'], $values));
    }

    /**
     * Compile the where raw query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where raw query.
     */
    protected function where_raw(QueryBuilder $builder, $where)
    {
        return $where['sql'] instanceof Expression ? $where['sql']->get_value($this) : $where['sql'];
    }

    /**
     * Compile the where basic query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where basic query.
     */
    protected function where_basic(QueryBuilder $builder, $where)
    {
        $value = $this->parameter($where['value']);
        $operator = $where['operator'];

        return sprintf(
            '%s %s %s',
            $this->wrap($where['column']),
            $operator,
            $value
        );
    }

    /**
     * Compile the where like query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where like query.
     */
    protected function where_like(QueryBuilder $query, $where)
    {
        $where['operator'] = $where['not'] ? 'not like' : 'like';

        return $this->where_basic($query, $where);
    }

    /**
     * Compile the where in query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where in query.
     */
    protected function where_in(QueryBuilder $query, $where)
    {
        if (empty($where['values'])) {
            return '0 = 1';
        }

        return sprintf(
            '%s in (%s)',
            $this->wrap($where['column']),
            $this->parameterize($where['values'])
        );
    }

    /**
     * Compile the where not in query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where not in query.
     */
    protected function where_not_in(QueryBuilder $query, $where)
    {
        if (empty($where['values'])) {
            return '1 = 1';
        }

        return sprintf(
            '%s not in (%s)',
            $this->wrap($where['column']),
            $this->parameterize($where['values'])
        );
    }

    /**
     * Compile the where in raw query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where in raw query.
     */
    protected function where_in_raw(QueryBuilder $query, $where)
    {
        if (empty($where['values'])) {
            return '0 = 1';
        }

        return sprintf(
            '%s in (%s)',
            $this->wrap($where['column']),
            implode(', ', $where['values'])
        );
    }

    /**
     * Compile the where not in raw query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where not in raw query.
     */
    protected function where_not_in_raw(QueryBuilder $query, $where)
    {
        if (empty($where['values'])) {
            return '1 = 1';
        }

        return sprintf(
            '%s not in (%s)',
            $this->wrap($where['column']),
            implode(', ', $where['values'])
        );
    }

    /**
     * Compile the where null query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where null query.
     */
    protected function where_null(QueryBuilder $query, $where)
    {
        return $this->wrap($where['column']) . ' is null';
    }

    /**
     * Compile the where not null query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where not null query.
     */
    protected function where_not_null(QueryBuilder $query, $where)
    {
        return $this->wrap($where['column']) . ' is not null';
    }

    /**
     * Compile the where between query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where between query.
     */
    protected function where_between(QueryBuilder $query, $where)
    {
        $between = $where['not'] ? 'not between' : 'between';
        $min = $this->parameter($where['values'][0]);
        $max = $this->parameter($where['values'][1]);

        return sprintf(
            '%s %s %s and %s',
            $this->wrap($where['column']),
            $between,
            $min,
            $max
        );
    }

    /**
     * Compile the where date query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where date query.
     */
    protected function where_date(QueryBuilder $query, $where)
    {
        return $this->date_based_where('date', $query, $where);
    }

    /**
     * Compile the where time query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where time query.
     */
    protected function where_time(QueryBuilder $query, $where)
    {
        return $this->date_based_where('time', $query, $where);
    }

    /**
     * Compile the date based where query.
     *
     * @param $type The type query.
     * @param $where The where query.
     *
     * @return string The compiled date based where query.
     */
    protected function date_based_where($type, QueryBuilder $query, $where)
    {
        $value = $this->parameter($where['value']);

        return sprintf(
            '%s (%s) %s %s',
            $type,
            $this->wrap($where['column']),
            $where['operator'],
            $value
        );
    }

    /**
     * Compile the where column query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where column query.
     */
    protected function where_column(QueryBuilder $query, $where)
    {
        return sprintf(
            '%s %s %s',
            $this->wrap($where['first']),
            $where['operator'],
            $this->wrap($where['second'])
        );
    }

    /**
     * Compile the where nested query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where nested query.
     */
    protected function where_nested(QueryBuilder $query, $where)
    {
        $offset = $where['query'] instanceof JoinClause ? 3 : 6;

        return sprintf(
            '(%s)',
            substr(
                $this->compile_wheres($where['query']),
                $offset
            )
        );
    }

    /**
     * Compile the where subquery query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where subquery query.
     */
    protected function where_subquery(QueryBuilder $query, $where)
    {
        $select = $this->compile_select($where['query']);

        return sprintf(
            '%s %s (%s)',
            $this->wrap($where['column']),
            $where['operator'],
            $select
        );
    }

    /**
     * Compile the where exists query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where exists query.
     */
    protected function where_exists(QueryBuilder $query, $where)
    {
        return sprintf(
            'exists (%s)',
            $this->compile_select($where['query'])
        );
    }

    /**
     * Compile the where not exists query.
     *
     * @param $where The where query.
     *
     * @return string The compiled where not exists query.
     */
    protected function where_not_exists(QueryBuilder $query, $where)
    {
        return sprintf(
            'not exists (%s)',
            $this->compile_select($where['query'])
        );
    }

    /**
     * Prepare the bindings for the update query.
     *
     * @param array $bindings The bindings for the query.
     * @param array $values The values to update.
     *
     * @return array The prepared bindings.
     */
    public function prepare_bindings_for_update($bindings, $values)
    {
        $clean_bindings = collection($bindings)->filter(fn($_, $key) => !in_array($key, ['select', 'join'], true));

        $values = Arr::flatten($values);

        return array_values(
            array_merge(
                $bindings['join'],
                $values,
                Arr::flatten($clean_bindings->all())
            )
        );
    }

    /**
     * Prepare the bindings for the delete query.
     *
     * @param array $bindings The bindings for the query.
     *
     * @return array The prepared bindings.
     */
    public function prepare_bindings_for_delete($bindings)
    {
        $clean_bindings = collection($bindings)->filter(fn($_, $key) => !in_array($key, ['select'], true));

        return Arr::flatten($clean_bindings->all());
    }

    /**
     * Substitute the bindings into the raw SQL.
     *
     * @param string $sql The raw SQL to substitute the bindings into.
     * @param array $bindings The bindings to substitute into the raw SQL.
     *
     * @return string The substituted raw SQL.
     */
    public function substitute_bindings_into_raw_sql($sql, array $bindings = [])
    {
        if (empty($bindings)) {
            return $sql;
        }

        return $this->connection->get_db()->prepare($sql, $bindings);
    }
}
