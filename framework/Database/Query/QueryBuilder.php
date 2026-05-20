<?php

namespace Kirki\Ecommerce\Database\Query;

use BadMethodCallException;
use Closure;
use DateTimeInterface;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Concerns\ExecuteQueries;
use Kirki\Ecommerce\Database\Concerns\RelationshipQueries;
use Kirki\Ecommerce\Database\Connection\Connection;
use Kirki\Ecommerce\Database\Query\EagerLoader;
use Kirki\Ecommerce\Database\Query\Relations\Relation;
use Kirki\Ecommerce\Exceptions\ModelNotFoundException;
use Kirki\Ecommerce\Exceptions\MultipleRecordsFoundException;
use Kirki\Ecommerce\Exceptions\RecordNotFoundException;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Supports\Str;
use Kirki\Ecommerce\Supports\Traits\Conditionable;
use Kirki\Ecommerce\Supports\Traits\Macroable;
use InvalidArgumentException;

use function Kirki\Ecommerce\collection;

/**
 * The QueryBuilder class provides a fluent interface for building SQL queries.
 *
 * This class allows you to construct complex SQL queries using a chainable
 * method syntax, making it easier to write and maintain database queries.
 * 
 * @method QueryBuilder when($value, callable $callback, $default)
 * @method QueryBuilder unless($value, callable $callback, $default)
 *
 * @since 1.0.0
 */
class QueryBuilder
{
    use ExecuteQueries, RelationshipQueries, Conditionable, Macroable {
        __call as macroCall;
    }

    /**
     * Default pagination limit
     *
     * @var int
     */
    const PAGINATION_LIMIT = 20;

    /**
     * The database connection instance used to execute queries.
     *
     * @var \Ecommerce\Database\Connection\Connection
     */
    public $connection;

    /**
     * The query compiler instance used to compile the query.
     *
     * @var \Ecommerce\Database\Query\QueryCompiler
     */
    public $compiler;

    /**
     * The name of the table to perform queries against.
     *
     * @var string|null
     */
    public $from;

    /**
     * The columns to be selected in the query. Defaults to all columns.
     *
     * @var array|null
     */
    public $columns;

    /**
     * The where conditions applied to the query for filtering results.
     *
     * @var array
     */
    public $wheres = [];

    /**
     * The bindings for prepared statements to prevent SQL injection.
     *
     * @var array
     */
    public $bindings = [
        'select' => [],
        'from' => [],
        'join' => [],
        'where' => [],
        'group_by' => [],
        'having' => [],
        'order' => [],
    ];

    /**
     * List of valid SQL operators supported by the query builder.
     *
     * @var array
     */
    public $operators = [
        '=',
        '<',
        '>',
        '<=',
        '>=',
        '<>',
        '!=',
        '<=>',
        'like',
        'like binary',
        'not like',
        'ilike',
        '&',
        '|',
        '^',
        '<<',
        '>>',
        '&~',
        'is',
        'is not',
        'rlike',
        'not rlike',
        'regexp',
        'not regexp',
        '~',
        '~*',
        '!~',
        '!~*',
        'similar to',
        'not similar to',
        'not ilike',
        '~~*',
        '!~~*',
    ];

    /**
     * The join clauses to include related tables in the query.
     *
     * @var array|null
     */
    public $joins;

    /**
     * The columns used to group the query results.
     *
     * @var array|null
     */
    public $groups;

    /**
     * The having conditions applied after grouping results.
     *
     * @var array|null
     */
    public $havings;

    /**
     * The order by clauses to sort the query results.
     *
     * @var array|null
     */
    public $orders;

    /**
     * The aggregate function and columns to be used in the query.
     *
     * @var array|null
     */
    public $aggregate;

    /**
     * The maximum number of records to return from the query.
     *
     * @var int|null
     */
    public $limit;

    /**
     * The number of records to skip before starting to return results.
     *
     * @var int|null
     */
    public $offset;

    /**
     * The relationships to eager load with the query results.
     *
     * @var array
     */
    public $relations = [];

    /**
     * The relationships to count with the query results.
     *
     * @var array
     */
    public $with_count = [];

    /**
     * The model class used to hydrate the query results.
     *
     * @var Model|null
     */
    public $model = null;

    /**
     * The Wordpress Database connection instance.
     *
     * @var \wpdb|null
     */
    public $db = null;

    /**
     * The distinct flag to select distinct rows from the query.
     *
     * @var bool|array
     */
    public $distinct = false;

    /**
     * The flag to enable or disable resolving relations of the results.
     *
     * @var bool
     */
    protected static $should_resolve_relations = true;

    /**
     * Initialize a new QueryBuilder instance with database connection, table name and model class
     *
     * @param Connection $connection The database connection instance
     * @param string|null $table The table name to query against
     * @param Model|null $model The model class for hydrating results
     *
     * @return void
     *
     * @since 1.0.0
     */
    public function __construct(Connection $connection, $compiler = null, $model = null)
    {
        $this->connection = $connection;
        $this->compiler = $compiler ?? $this->connection->get_query_compiler();
        $this->model = $model;
        $this->db = $connection->get_db();

        $this->sync_with_model();
    }

    /**
     * Sync the query builder with the model
     *
     * @return void
     */
    protected function sync_with_model()
    {
        if ($this->model) {
            $table_name = $this->model->get_table();
            $this->from($table_name);
        }
    }

    public function set_model(Model $model)
    {
        $this->model = $model;
        $this->sync_with_model();
    }

    /**
     * Get the model instance
     *
     * @return Model|null The model instance
     */
    public function get_model()
    {
        return $this->model;
    }

    /**
     * Get the query compiler instance
     *
     * @return QueryCompiler
     */
    public function get_compiler()
    {
        return $this->connection->get_query_compiler();
    }

    /**
     * Get the limit for the query
     *
     * @return int|null The limit for the query
     */
    public function get_limit()
    {
        return !is_null($this->limit) ? (int) $this->limit : null;
    }

    /**
     * Get the offset for the query
     *
     * @return int|null The offset for the query
     */
    public function get_offset()
    {
        return !is_null($this->offset) ? (int) $this->offset : null;
    }

    public function default_key_name()
    {
        if ($this->model) {
            return $this->model->get_primary_key();
        }

        return 'id';
    }

    /**
     * Set the table name for the query
     *
     * @param string|Expression|QueryBuilder|Model $table The table name to query
     * @param string|null $as The alias of the table.
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function from($table, $as = null)
    {
        if (is_subclass_of($table, Model::class)) {
            $table = (new $table)->get_table();
        }

        if ($this->is_queryable($table)) {
            return $this->from_subquery($table, $as);
        }

        $this->from = $as ? sprintf('%s as %s', $table, $as) : $table;

        return $this;
    }

    /**
     * Set the table source using a subquery
     *
     * @param QueryBuilder|Closure $query The subquery to set as the table source
     * @param string $as The alias for the subquery
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function from_subquery($query, $as)
    {
        [$query, $bindings] = $this->create_subquery($query);

        return $this->from_raw(
            sprintf('(%s) as %s', $query, $as),
            $bindings
        );
    }

    /**
     * Set the table source using a raw expression
     *
     * @param string $expression The raw SQL expression to set as the table source
     * @param array $bindings The bindings for the raw expression
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function from_raw($expression, array $bindings = [])
    {
        $this->from = new Expression($expression);

        $this->add_bindings($bindings, 'from');

        return $this;
    }

    /**
     * Set the bindings for the query
     *
     * @param array $bindings The bindings to set
     * @param string $type The type of binding to set
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function set_bindings(array $bindings, $type = 'where')
    {
        if (!array_key_exists($type, $this->bindings)) {
            throw new InvalidArgumentException("Invalid binding type: $type");
        }

        $this->bindings[$type] = $bindings;

        return $this;
    }

    /**
     * Add bindings to the query
     *
     * @param mixed $value The value to add to the bindings
     * @param string $type The type of binding to add
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function add_bindings($value, $type = 'where')
    {
        $type = strtolower($type);

        if (!array_key_exists($type, $this->bindings)) {
            throw new InvalidArgumentException(sprintf('Invalid binding type: %s', $type));
        }

        if (is_array($value)) {
            $this->bindings[$type] = array_values(
                array_merge($this->bindings[$type], $value)
            );
        } else {
            $this->bindings[$type][] = $value;
        }

        return $this;
    }

    /**
     * Set the columns to be selected in the query
     *
     * This method allows you to specify which columns should be returned from the database query.
     * You can pass either an array of column names or multiple string arguments. If no columns
     * are specified, it defaults to selecting all columns using the wildcard (*).
     *
     * @param array|string $columns The columns to select, defaults to all columns
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function select($columns = ['*'])
    {
        $this->columns = [];
        $this->bindings['select'] = [];

        $columns = is_array($columns) ? $columns : func_get_args();

        foreach ($columns as $as => $column) {
            if (is_string($as) && $this->is_queryable($column)) {
                $this->select_subquery($column, $as);
            } else {
                $this->columns[] = $column;
            }
        }

        return $this;
    }

    /**
     * Add a raw SELECT clause to the query
     *
     * @param string $expression The raw SQL expression to select
     * @param array $bindings Parameter values to bind to the query
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     * 
     * @since 1.0.0
     */
    public function select_raw($expression, array $bindings = [])
    {
        $this->add_select(new Expression($expression));

        if ($bindings) {
            $this->add_bindings($bindings, 'select');
        }

        return $this;
    }

    /**
     * Add a subquery to the SELECT clause
     *
     * @param Closure|QueryBuilder $query The subquery to add
     * @param string $as The alias for the subquery
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     * 
     * @since 1.0.0
     */
    public function select_subquery($query, $as)
    {
        [$query, $bindings] = $this->create_subquery($query);

        return $this->select_raw(
            sprintf('(%s) as %s', $query, $as),
            $bindings
        );
    }

    /**
     * Add a column to the SELECT clause
     *
     * @param string|Expression|array $column The column to add
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     * 
     * @since 1.0.0
     */
    public function add_select($column)
    {
        $columns = is_array($column) ? $column : func_get_args();

        foreach ($columns as $as => $column) {
            if (is_string($as) && $this->is_queryable($column)) {
                if (is_null($this->columns)) {
                    $this->select(sprintf('%s.*', $this->from));
                }

                $this->select_subquery($column, $as);
            } else {
                if (is_array($this->columns) && in_array($column, $this->columns, true)) {
                    continue;
                }

                $this->columns[] = $column;
            }
        }

        return $this;
    }

    /**
     * Set the distinct flag for the query
     *
     * @param array|bool $columns The columns to distinct on
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     * 
     * @since 1.0.0
     */
    public function distinct()
    {
        $columns = func_get_args();

        if (count($columns) > 0) {
            $this->distinct = is_array($columns[0]) || is_bool($columns[0]) ? $columns[0] : $columns;
        } else {
            $this->distinct = true;
        }

        return $this;
    }

    /**
     * Check if the query has any results
     *
     * @return bool True if the query has any results, false otherwise
     * 
     * @since 1.0.0
     */
    public function exists()
    {
        $results = $this->connection->select(
            $this->compiler->compile_exists($this),
            $this->get_bindings()
        );

        if (isset($results[0])) {
            $results = (array) $results[0];

            return (bool) $results['exists'];
        }

        return false;
    }

    /**
     * Check if the query does not have any results
     *
     * @return bool True if the query does not have any results, false otherwise
     * 
     * @since 1.0.0
     */
    public function does_not_exists()
    {
        return !$this->exists();
    }

    /**
     * Get the value of a single column from the first result
     *
     * @param string $column The column name to get the value from
     *
     * @return mixed The value of the column
     * 
     * @since 1.0.0
     */
    public function value($column)
    {
        $result = (array) $this->first([$column]);

        return count($result) > 0 ? reset($result) : null;
    }

    /**
     * Add a WHERE clause to the query with AND condition
     *
     * This method adds a basic WHERE condition to the query using the AND boolean operator.
     * If only two parameters are provided, the operator defaults to '=' for equality comparison.
     * The condition is added to the existing WHERE conditions array and the value is bound
     * to prevent SQL injection attacks.
     *
     * @param string $column The column name to filter
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where($column, $operator = null, $value = null, $boolean = 'and')
    {
        if (is_array($column)) {
            return $this->add_array_of_wheres($column, $boolean);
        }

        [$value, $operator] = $this->prepare_value_and_operator(
            $value,
            $operator,
            func_num_args() === 2
        );

        if ($column instanceof Closure && is_null($operator)) {
            return $this->where_nested($column, $boolean);
        }

        if ($this->is_queryable($column) && !is_null($operator)) {
            [$sub_query, $bindings] = $this->create_subquery($column);

            return $this->add_bindings($bindings, 'where')
                ->where(new Expression('(' . $sub_query . ')'), $operator, $value, $boolean);
        }

        if ($this->is_invalid_operator($operator)) {
            [$value, $operator] = [$operator, '='];
        }

        if ($this->is_queryable($value)) {
            return $this->where_subquery($value, $operator, $value, $boolean);
        }

        if (is_null($value)) {
            return $this->where_null($column, $boolean, $operator !== '=');
        }

        $type = 'basic';

        $this->wheres[] = compact('type', 'column', 'operator', 'value', 'boolean');
        $this->add_bindings($value, 'where');

        return $this;
    }

    /**
     * Add a WHERE clause to the query with a subquery
     *
     * @param string $column The column name to filter
     * @param string $operator The comparison operator (=, >, <, etc.)
     * @param Closure $callback The subquery to add
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    protected function where_subquery($column, $operator, $callback, $boolean)
    {
        $type = 'subquery';

        if ($callback instanceof Closure) {
            $callback($query = $this->for_subquery());
        } else {
            $query = $callback;
        }

        $this->wheres[] = compact('type', 'column', 'operator', 'query', 'boolean');
        $this->add_bindings($query->get_bindings(), 'where');

        return $this;
    }

    /**
     * Add a WHERE clause to the query with a raw SQL expression
     *
     * @param string $sql The raw SQL expression to add
     * @param array $bindings The bindings for the raw expression
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_raw($sql, array $bindings = [], $boolean = 'and')
    {
        $type = 'raw';

        $this->wheres[] = compact(
            'type',
            'sql',
            'boolean'
        );

        $this->add_bindings($bindings, 'where');

        return $this;
    }

    /**
     * Add a WHERE clause to the query with a raw SQL expression and OR condition
     *
     * @param string $sql The raw SQL expression to add
     * @param array $bindings The bindings for the raw expression
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_raw($sql, array $bindings = [])
    {
        return $this->where_raw($sql, $bindings, 'or');
    }

    /**
     * Add a WHERE clause to the query with a LIKE condition
     *
     * @param string $column The column name to filter
     * @param string $value The value to compare against
     * @param bool $case_sensitive Whether the comparison should be case-sensitive
     * @param string $boolean The boolean operator (and, or)
     * @param bool $not Whether the condition should be negated
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_like($column, $value, $case_sensitive = false, $boolean = 'and', $not = false)
    {
        $type = 'like';
        $this->wheres[] = compact('type', 'column', 'value', 'case_sensitive', 'boolean', 'not');

        $this->add_bindings($value, 'where');

        return $this;
    }

    /**
     * Add a WHERE clause to the query with a LIKE condition and OR condition
     *
     * @param string $column The column name to filter
     * @param string $value The value to compare against
     * @param bool $case_sensitive Whether the comparison should be case-sensitive
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_like($column, $value, $case_sensitive = false)
    {
        return $this->where_like($column, $value, $case_sensitive, 'or', false);
    }

    /**
     * Add a WHERE clause to the query with a LIKE condition and NOT condition
     *
     * @param string $column The column name to filter
     * @param string $value The value to compare against
     * @param bool $case_sensitive Whether the comparison should be case-sensitive
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_not_like($column, $value, $case_sensitive = false, $boolean = 'and')
    {
        return $this->where_like($column, $value, $case_sensitive, $boolean, true);
    }

    /**
     * Add a WHERE clause to the query with a LIKE condition and NOT condition and OR condition
     *
     * @param string $column The column name to filter
     * @param string $value The value to compare against
     * @param bool $case_sensitive Whether the comparison should be case-sensitive
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_not_like($column, $value, $case_sensitive = false)
    {
        return $this->where_not_like($column, $value, $case_sensitive, 'or');
    }

    /**
     * Add a WHERE clause to the query with OR condition
     *
     * This method adds a basic WHERE condition to the query using the OR boolean operator.
     * It functions identically to the where() method but uses OR instead of AND to combine
     * with previous conditions. The operator defaults to '=' if not specified.
     *
     * @param string $column The column name to filter
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where($column, $operator = null, $value = null)
    {
        [$value, $operator] = $this->prepare_value_and_operator(
            $value,
            $operator,
            func_num_args() === 2
        );

        return $this->where($column, $operator, $value, 'or');
    }

    /**
     * Add a WHERE clause to the query with a NOT condition
     *
     * @param string $column The column name to filter
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_not($column, $operator = null, $value = null, $boolean = 'and')
    {
        if (is_array($column)) {
            return $this->where_nested(function ($query) use ($column, $operator, $value, $boolean) {
                $query->where($column, $operator, $value, $boolean);
            }, $boolean . ' not');
        }

        return $this->where($column, $operator, $value, $boolean . ' not');
    }

    /**
     * Add a WHERE clause to the query with a NOT condition and OR condition
     *
     * @param string $column The column name to filter
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_not($column, $operator = null, $value = null)
    {
        return $this->where_not($column, $operator, $value, 'or');
    }

    /**
     * Add a WHERE IN clause to filter records where column value is in the given array
     *
     * This method creates a WHERE IN condition that matches records where the specified
     * column's value exists within the provided array of values. All values in the array
     * are properly bound to prevent SQL injection. This is useful for filtering records
     * that match any of multiple possible values.
     *
     * @param string $column The column name to check
     * @param array|Closure $values The array of values to match against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_in($column, $values, $boolean = 'and', $not = false)
    {
        $type = $not ? 'not_in' : 'in';

        if ($this->is_queryable($values)) {
            [$query, $bindings] = $this->create_subquery($values);

            $values = [new Expression($query)];

            $this->add_bindings($bindings, 'where');
        }

        $this->wheres[] = compact(
            'type',
            'column',
            'values',
            'boolean'
        );

        if (count($values) !== count(Arr::flatten($values, 1))) {
            throw new InvalidArgumentException('Nested array of values is not allowed');
        }

        $this->add_bindings($this->clean_bindings($values), 'where');

        return $this;
    }

    /**
     * Add a WHERE IN clause to filter records where column value is in the given array and OR condition
     *
     * @param string $column The column name to check
     * @param array $values The array of values to match against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_in($column, $values)
    {
        return $this->where_in($column, $values, 'or');
    }

    /**
     * Add a WHERE NOT IN clause to filter records where column value is not in the given array
     *
     * This method creates a WHERE NOT IN condition that matches records where the specified
     * column's value does not exist within the provided array of values. It's the inverse
     * of the whereIn() method and is useful for excluding records that match certain values.
     *
     * @param string $column The column name to check
     * @param array $value The array of values to exclude
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_not_in($column, $values, $boolean = 'and')
    {
        return $this->where_in($column, $values, $boolean, true);
    }

    /**
     * Add a WHERE NOT IN clause to filter records where column value is not in the given array and OR condition
     *
     * @param string $column The column name to check
     * @param array $values The array of values to exclude
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_not_in($column, $values)
    {
        return $this->where_not_in($column, $values, 'or');
    }

    /**
     * Add a WHERE BETWEEN clause to filter records where column value is between two values
     *
     * This method creates a WHERE BETWEEN condition that matches records where the specified
     * column's value falls within the range defined by the two provided values (inclusive).
     * The values array must contain exactly two elements: the start and end of the range.
     *
     * @param string $column The column name to check
     * @param array $value Array containing the start and end values for the range
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_between($column, $values, $boolean = 'and', $not = false)
    {
        $type = 'between';

        $this->wheres[] = compact('type', 'column', 'values', 'boolean', 'not');

        $this->add_bindings(array_slice(
            $this->clean_bindings(Arr::flatten($values)),
            0,
            2
        ), 'where');

        return $this;
    }

    /**
     * Add a WHERE BETWEEN clause to filter records where column value is between two values and OR condition
     *
     * @param string $column The column name to check
     * @param array $values Array containing the start and end values for the range to include
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_between($column, $values)
    {
        return $this->where_between($column, $values, 'or');
    }

    /**
     * Add a WHERE NOT BETWEEN clause to filter records where column value is not between two values
     *
     * This method creates a WHERE NOT BETWEEN condition that matches records where the specified
     * column's value falls outside the range defined by the two provided values. It's the inverse
     * of the whereBetween() method and excludes records within the specified range.
     *
     * @param string $column The column name to check
     * @param array $values Array containing the start and end values for the range to exclude
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_not_between($column, $values, $boolean = 'and')
    {
        return $this->where_between($column, $values, $boolean, true);
    }

    /**
     * Add a WHERE NOT BETWEEN clause to filter records where column value is not between two values and OR condition
     *
     * @param string $column The column name to check
     * @param array $values Array containing the start and end values for the range to exclude
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_not_between($column, $values)
    {
        return $this->where_not_between($column, $values, 'or');
    }

    /**
     * Add a WHERE IS NULL clause to filter records where column value is null
     *
     * This method creates a WHERE IS NULL condition that matches records where the specified
     * column contains a null value. This is useful for finding records with missing or
     * undefined data in specific columns.
     *
     * @param string $column The column name to check for null values
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_null($columns, $boolean = 'and', $not = false)
    {
        $type = $not ? 'not_null' : 'null';

        foreach (Arr::wrap($columns) as $column) {
            $this->wheres[] = compact('type', 'column', 'boolean');
        }


        return $this;
    }

    /**
     * Add a WHERE IS NULL clause to filter records where column value is null and OR condition
     *
     * @param string $column The column name to check for null values
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_null($column)
    {
        return $this->where_null($column, 'or');
    }

    /**
     * Add a WHERE IS NOT NULL clause to filter records where column value is not null
     *
     * This method creates a WHERE IS NOT NULL condition that matches records where the specified
     * column contains any non-null value. It's useful for ensuring that records have actual
     * data in specific columns and excluding records with missing values.
     *
     * @param string $column The column name to check for non-null values
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_not_null($column, $boolean = 'and')
    {
        return $this->where_null($column, $boolean, true);
    }

    /**
     * Add a WHERE IS NOT NULL clause to filter records where column value is not null and OR condition
     *
     * @param string $column The column name to check for non-null values
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_not_null($column)
    {
        return $this->where_not_null($column, 'or');
    }

    /**
     * Add a WHERE DATE clause to filter records where column value is a date
     *
     * @param string $column The column name to check for date values
     * @param string $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_date($column, $operator, $value = null, $boolean = 'and')
    {
        [$value, $operator] = $this->prepare_value_and_operator(
            $value,
            $operator,
            func_num_args() === 2
        );

        if ($this->is_invalid_operator($operator)) {
            [$value, $operator] = [$operator, '='];
        }

        $value = $this->flatten_value($value);

        if ($value instanceof DateTimeInterface) {
            $value = $value->format('Y-m-d');
        }

        return $this->add_date_based_where('date', $column, $operator, $value, $boolean);
    }

    /**
     * Add a WHERE DATE clause to filter records where column value is a date and OR condition
     *
     * @param string $column The column name to check for date values
     * @param string $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_date($column, $operator, $value = null)
    {
        [$value, $operator] = $this->prepare_value_and_operator(
            $value,
            $operator,
            func_num_args() === 2
        );

        return $this->where_date($column, $operator, $value, 'or');
    }

    /**
     * Add a WHERE DATE clause to filter records where column value is a date
     *
     * @param string $type The type of date comparison (date or time)
     * @param string $column The column name to check for date values
     * @param string $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    protected function add_date_based_where($type, $column, $operator, $value, $boolean)
    {
        $this->wheres[] = compact('column', 'type', 'boolean', 'operator', 'value');

        if (!$value instanceof Expression) {
            $this->add_bindings($value, 'where');
        }

        return $this;
    }

    /**
     * Add a WHERE TIME clause to filter records where column value is a time
     *
     * @param string $column The column name to check for time values
     * @param string $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_time($column, $operator, $value = null, $boolean = 'and')
    {
        [$value, $operator] = $this->prepare_value_and_operator(
            $value,
            $operator,
            func_num_args() === 2
        );

        if ($this->is_invalid_operator($operator)) {
            [$value, $operator] = [$operator, '='];
        }

        $value = $this->flatten_value($value);

        if ($value instanceof DateTimeInterface) {
            $value = $value->format('H:i:s');
        }

        return $this->add_date_based_where('time', $column, $operator, $value, $boolean);
    }

    /**
     * Add a WHERE TIME clause to filter records where column value is a time and OR condition
     *
     * @param string $column The column name to check for time values
     * @param string $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_time($column, $operator, $value = null)
    {
        [$value, $operator] = $this->prepare_value_and_operator(
            $value,
            $operator,
            func_num_args() === 2
        );

        return $this->where_time($column, $operator, $value, 'or');
    }

    /**
     * Add a WHERE COLUMN clause to filter records where two columns are equal
     *
     * This method creates a WHERE COLUMN condition that matches records where the
     * values of the two specified columns are equal. It's useful for comparing
     * values between different columns in the same table.
     *
     * @param string $first The first column to compare
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param string|null $second The second column to compare
     * @param string $boolean The boolean operator to combine with previous conditions
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_column($first, $operator = null, $second = null, $boolean = 'and')
    {
        if (is_array($first)) {
            return $this->add_array_of_wheres($first, $boolean, 'where_column');
        }

        if ($this->is_invalid_operator($operator)) {
            [$second, $operator] = [$operator, '='];
        }

        $type = 'column';

        $this->wheres[] = compact(
            'type',
            'first',
            'operator',
            'second',
            'boolean'
        );

        return $this;
    }

    /**
     * Add a WHERE COLUMN clause to filter records where two columns are equal and OR condition
     *
     * @param string $first The first column to compare
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param string|null $second The second column to compare
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_column($first, $operator = null, $second = null)
    {
        return $this->where_column($first, $operator, $second, 'or');
    }

    /**
     * Add a WHERE ALL clause to filter records where all columns match the given value
     *
     * @param array $columns The columns to check for matching values
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     * @param string $boolean The boolean operator to combine with previous conditions
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_all($columns, $operator = null, $value = null, $boolean = 'and')
    {
        [$value, $operator] = $this->prepare_value_and_operator(
            $value,
            $operator,
            func_num_args() === 2
        );

        $this->where_nested(function ($query) use ($columns, $operator, $value) {
            foreach ($columns as $column) {
                $query->where($column, $operator, $value, 'and');
            }
        }, $boolean);

        return $this;
    }

    /**
     * Add a WHERE ALL clause to filter records where all columns match the given value and OR condition
     *
     * @param array $columns The columns to check for matching values
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_all($columns, $operator = null, $value = null)
    {
        return $this->where_all($columns, $operator, $value, 'or');
    }

    /**
     * Add a WHERE ANY clause to filter records where any column matches the given value
     *
     * @param array $columns The columns to check for matching values
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     * @param string $boolean The boolean operator to combine with previous conditions
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_any($columns, $operator = null, $value = null, $boolean = 'and')
    {
        [$value, $operator] = $this->prepare_value_and_operator(
            $value,
            $operator,
            func_num_args() === 2
        );

        $this->where_nested(function ($query) use ($columns, $operator, $value) {
            foreach ($columns as $column) {
                $query->where($column, $operator, $value, 'or');
            }
        }, $boolean);

        return $this;
    }

    /**
     * Add a WHERE ANY clause to filter records where any column matches the given value and OR condition
     *
     * @param array $columns The columns to check for matching values
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_any($columns, $operator = null, $value = null)
    {
        return $this->where_any($columns, $operator, $value, 'or');
    }

    /**
     * Add a WHERE NONE clause to filter records where no column matches the given value
     *
     * @param array $columns The columns to check for matching values
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     * @param string $boolean The boolean operator to combine with previous conditions
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_none($columns, $operator = null, $value = null, $boolean = 'and')
    {
        return $this->where_any($columns, $operator, $value, $boolean . ' not');
    }

    /**
     * Add a WHERE NONE clause to filter records where no column matches the given value and OR condition
     *
     * @param array $columns The columns to check for matching values
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_none($columns, $operator = null, $value = null)
    {
        return $this->where_none($columns, $operator, $value, 'or');
    }

    /**
     * Merge an array of WHERE conditions into the query
     *
     * @param array $wheres The array of WHERE conditions to merge
     * @param array $bindings The array of bindings to merge
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function merge_wheres($wheres, $bindings)
    {
        $this->wheres = array_merge($this->wheres, $wheres);

        $this->bindings['where'] = array_values(
            array_merge($this->bindings['where'], $bindings)
        );

        return $this;
    }

    /**
     * Add an array of WHERE conditions to the query
     *
     * @param array $column The array of columns to add WHERE conditions for
     * @param string $boolean The boolean operator (and, or)
     * @param string $method The method to use for adding the conditions (where, or_where, etc.)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    protected function add_array_of_wheres(array $column, $boolean, $method = 'where')
    {
        return $this->where_nested(function ($query) use ($column, $method, $boolean) {
            foreach ($column as $key => $value) {
                if (is_numeric($key) && is_array($value)) {
                    call_user_func_array([$query, $method], array_merge(array_values($value), [$boolean]));
                } else {
                    $query->$method($key, '=', $value, $boolean);
                }
            }
        }, $boolean);
    }

    /**
     * Add a nested WHERE condition to the query
     *
     * @param Closure $callback The callback function to add the nested WHERE condition
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    protected function where_nested(Closure $callback, $boolean = 'and')
    {
        $callback($query = $this->for_nested_where());

        return $this->add_nested_where_query($query, $boolean);
    }

    /**
     * Add a nested WHERE condition to the query
     *
     * @param QueryBuilder $query The query builder instance to add the nested WHERE condition to
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    protected function add_nested_where_query($query, $boolean = 'and')
    {
        if (count($query->wheres)) {
            $type = 'nested';
            $this->wheres[] = compact('type', 'query', 'boolean');
            $this->add_bindings($query->get_binding('where'), 'where');
        }

        return $this;
    }

    /**
     * Create a new query builder instance for nested WHERE conditions
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    protected function for_nested_where()
    {
        return $this->new_query()->from($this->from);
    }

    /**
     * Add a WHERE EXISTS clause to the query
     *
     * @param Closure $callback The callback function to add the WHERE EXISTS condition
     * @param string $boolean The boolean operator (and, or)
     * @param bool $not Whether the condition should be negated
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_exists($callback, $boolean = 'and', $not = false)
    {
        if ($callback instanceof Closure) {
            $query = $this->for_subquery();
            $callback($query);
        } else {
            $query = $callback;
        }

        return $this->add_where_exists_query($query, $boolean, $not);
    }

    /**
     * Add a WHERE EXISTS clause to the query and OR condition
     *
     * @param Closure $callback The callback function to add the WHERE EXISTS condition
     * @param bool $not Whether the condition should be negated
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_exists($callback, $not = false)
    {
        return $this->where_exists($callback, 'or', $not);
    }

    /**
     * Add a WHERE EXISTS clause to the query and NOT condition
     *
     * @param Closure $callback The callback function to add the WHERE EXISTS condition
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function where_not_exists($callback, $boolean = 'and')
    {
        return $this->where_exists($callback, $boolean, true);
    }

    /**
     * Add a WHERE EXISTS clause to the query and NOT condition and OR condition
     *
     * @param Closure $callback The callback function to add the WHERE EXISTS condition
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_where_not_exists($callback)
    {
        return $this->where_not_exists($callback, 'or');
    }

    /**
     * Add a WHERE EXISTS clause to the query
     *
     * @param QueryBuilder $query The query builder instance to add the WHERE EXISTS condition to
     * @param string $boolean The boolean operator (and, or)
     * @param bool $not Whether the condition should be negated
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    protected function add_where_exists_query(QueryBuilder $query, $boolean = 'and', $not = false)
    {
        $type = $not ? 'not_exists' : 'exists';

        $this->wheres[] = compact('type', 'query', 'boolean');
        $this->add_bindings($query->get_bindings(), 'where');

        return $this;
    }

    /**
     * Add a JOIN clause to the query for combining records from multiple tables
     *
     * This method adds a JOIN clause to combine records from multiple tables based on a
     * related column between them. If the operator is not specified, it defaults to '='.
     * The join type can be INNER, LEFT, or RIGHT, with INNER being the default.
     *
     * @param string $table The table to join with
     * @param string $first The first column in the join condition
     * @param string|null $operator The join operator (=, >, <, etc.)
     * @param string|null $second The second column in the join condition
     * @param string $type The type of join (INNER, LEFT, RIGHT)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function join($table, $first, $operator = null, $second = null, $type = 'inner', $where = false)
    {
        $join = $this->new_join_clause($this, $type, $table);

        if ($first instanceof Closure) {
            $first($join);

            $this->joins[] = $join;

            $this->add_bindings($join->get_bindings(), 'join');
        } else {
            $method = $where ? 'where' : 'on';

            $this->joins[] = $join->$method($first, $operator, $second);

            $this->add_bindings($join->get_bindings(), 'join');
        }

        return $this;
    }

    /**
     * Add a JOIN clause to the query with WHERE condition
     *
     * @param string $table The table to join with
     * @param string $first The first column in the join condition
     * @param string $operator The join operator
     * @param string $second The second column in the join condition
     * @param string $type The type of join (INNER, LEFT, RIGHT)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function join_where($table, $first, $operator, $second, $type = 'inner')
    {
        return $this->join($table, $first, $operator, $second, $type, true);
    }

    /**
     * Add a JOIN clause to the query with a subquery
     *
     * @param QueryBuilder $query The subquery to join with
     * @param string $as The alias for the subquery
     * @param string $first The first column in the join condition
     * @param string|null $operator The join operator (=, >, <, etc.)
     * @param string|null $second The second column in the join condition
     * @param string $type The type of join (INNER, LEFT, RIGHT)
     * @param bool $where Whether to add a WHERE condition to the join
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function join_sub($query, $as, $first, $operator = null, $second = null, $type = 'inner', $where = false)
    {
        [$query, $bindings] = $this->create_subquery($query);

        $expression = sprintf('(%s) as %s', $query, $this->compiler->wrap_table($as));

        $this->add_bindings($bindings, 'join');

        return $this->join(new Expression($expression), $first, $operator, $second, $type, $where);
    }

    /**
     * Create a new join clause instance
     *
     * @param QueryBuilder $parent_query The parent query builder instance
     * @param string $type The join type (INNER, LEFT, RIGHT)
     * @param string $table The table to join with
     *
     * @return JoinClause
     *
     * @since 1.0.0
     */
    protected function new_join_clause(QueryBuilder $parent_query, $type, $table)
    {
        return new JoinClause($parent_query, $type, $table);
    }

    /**
     * Add a LEFT JOIN clause to the query
     *
     * This method creates a LEFT JOIN that returns all records from the left table and matching
     * records from the right table. If there's no match, NULL values are returned for the right
     * table columns. This is useful when you want to include all records from the primary table
     * regardless of whether they have related records in the joined table.
     *
     * @param string $table The table to join with
     * @param string $first The first column in the join condition
     * @param string|null $operator The join operator (=, >, <, etc.)
     * @param string|null $second The second column in the join condition
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function left_join($table, $first, $operator = null, $second = null)
    {
        return $this->join($table, $first, $operator, $second, 'left');
    }

    /**
     * Add a LEFT JOIN clause to the query with WHERE condition
     *
     * @param string $table The table to join with
     * @param string $first The first column in the join condition
     * @param string $operator The join operator
     * @param string $second The second column in the join condition
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function left_join_where($table, $first, $operator, $second)
    {
        return $this->join_where($table, $first, $operator, $second, 'left');
    }

    /**
     * Add a LEFT JOIN clause to the query with a subquery
     *
     * @param QueryBuilder $query The subquery to join with
     * @param string $as The alias for the subquery
     * @param string $first The first column in the join condition
     * @param string|null $operator The join operator (=, >, <, etc.)
     * @param string|null $second The second column in the join condition
     * 
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     * 
     * @since 1.0.0
     */
    public function left_join_sub($query, $as, $first, $operator = null, $second = null)
    {
        return $this->join_sub($query, $as, $first, $operator, $second, 'left');
    }

    /**
     * Add a RIGHT JOIN clause to the query
     *
     * This method creates a RIGHT JOIN that returns all records from the right table and matching
     * records from the left table. If there's no match, NULL values are returned for the left
     * table columns. This is less commonly used than LEFT JOIN but can be useful in specific
     * scenarios where you want all records from the joined table.
     *
     * @param string $table The table to join with
     * @param string $first The first column in the join condition
     * @param string|null $operator The join operator (=, >, <, etc.)
     * @param string|null $second The second column in the join condition
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function right_join($table, $first, $operator = null, $second = null)
    {
        return $this->join($table, $first, $operator, $second, 'right');
    }

    /**
     * Add a RIGHT JOIN clause to the query with WHERE condition
     *
     * @param string $table The table to join with
     * @param string $first The first column in the join condition
     * @param string $operator The join operator
     * @param string $second The second column in the join condition
     * 
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     * 
     * @since 1.0.0
     */
    public function right_join_where($table, $first, $operator, $second)
    {
        return $this->join_where($table, $first, $operator, $second, 'right');
    }

    /**
     * Add a RIGHT JOIN clause to the query with a subquery
     *
     * @param QueryBuilder $query The subquery to join with
     * @param string $as The alias for the subquery
     * @param string $first The first column in the join condition
     * @param string|null $operator The join operator (=, >, <, etc.)
     * @param string|null $second The second column in the join condition
     * 
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     * 
     * @since 1.0.0
     */
    public function right_join_sub($query, $as, $first, $operator = null, $second = null)
    {
        return $this->join_sub($query, $as, $first, $operator, $second, 'right');
    }

    /**
     * Add GROUP BY clause to group query results by specified columns
     *
     * This method adds columns to the GROUP BY clause, which groups rows that have the same
     * values in the specified columns into summary rows. This is typically used with aggregate
     * functions like COUNT, SUM, AVG, etc. Multiple columns can be specified to create
     * hierarchical grouping.
     *
     * @param string ...$groups The columns to group by
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function group_by(...$groups)
    {
        foreach ($groups as $group) {
            $this->groups = array_merge(
                (array) $this->groups,
                Arr::wrap($group)
            );
        }

        return $this;
    }

    /**
     * Add a raw GROUP BY clause to the query
     *
     * This method adds a raw GROUP BY clause to the query. It's useful when you need to
     * group by a column that doesn't exist in the table.
     *
     * @param string $sql The raw SQL query to execute
     * @param array $bindings Parameter values to bind to the query
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function group_by_raw($sql, array $bindings = [])
    {
        $this->groups[] = new Expression($sql);
        $this->add_bindings($bindings, 'group_by');

        return $this;
    }

    /**
     * Add HAVING clause to filter grouped results
     *
     * This method adds a HAVING condition that filters the results after grouping has been
     * applied. Unlike WHERE conditions which filter rows before grouping, HAVING conditions
     * filter groups after they've been formed. This is typically used with aggregate functions
     * to filter based on calculated values.
     *
     * @param string $column The column name to filter on
     * @param string $operator The comparison operator
     * @param mixed $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function having($column, $operator = null, $value = null, $boolean = 'and')
    {
        $type = 'basic';

        if ($column instanceof Expression) {
            $type = 'expression';
            $this->havings[] = compact('type', 'column', 'boolean');

            return $this;
        }

        [$value, $operator] = $this->prepare_value_and_operator(
            $value,
            $operator,
            func_num_args() === 2
        );

        if ($column instanceof Closure && is_null($operator)) {
            return $this->having_nested($column, $boolean);
        }

        if ($this->is_invalid_operator($operator)) {
            [$value, $operator] = [$operator, '='];
        }

        $this->havings[] = compact('type', 'column', 'value', 'boolean');

        if (!$value instanceof Expression) {
            $this->add_bindings($value, 'having');
        }

        return $this;
    }

    /**
     * Add a HAVING clause to the query with nested condition
     *
     * @param Closure $callback The callback function to add the nested HAVING condition
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    protected function having_nested(Closure $callback, $boolean = 'and')
    {
        $callback($query = $this->for_nested_where());

        return $this->add_nested_having_query($query, $boolean);
    }

    /**
     * Add a HAVING clause to the query with nested condition
     *
     * @param QueryBuilder $query The query builder instance to add the nested HAVING condition to
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    protected function add_nested_having_query($query, $boolean = 'and')
    {
        if (count($query->havings)) {
            $type = 'nested';
            $this->havings[] = compact('type', 'query', 'boolean');

            $this->add_bindings($query->get_binding('having'), 'having');
        }

        return $this;
    }

    /**
     * Add a HAVING clause to the query with OR condition
     *
     * This method adds a basic HAVING condition to the query using the OR boolean operator.
     * It functions identically to the having() method but uses OR instead of AND to combine
     * with previous conditions. The operator defaults to '=' if not specified.
     * 
     * @param string $column The column name to filter
     * @param string|null $operator The comparison operator (=, >, <, etc.)
     * @param mixed|null $value The value to compare against
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_having($column, $operator = null, $value = null)
    {
        [$value, $operator] = $this->prepare_value_and_operator($value, $operator, func_num_args() === 2);

        return $this->having($column, $operator, $value, 'or');
    }

    /**
     * Add a HAVING clause to the query with NULL condition
     *
     * @param string $columns The column name to filter
     * @param string $boolean The boolean operator (and, or)
     * @param bool $not Whether the condition should be negated
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function having_null($columns, $boolean = 'and', $not = false)
    {
        $type = $not ? 'not_null' : 'null';

        foreach (Arr::wrap($columns) as $column) {
            $this->havings[] = compact('type', 'column', 'boolean');
        }

        return $this;
    }

    /**
     * Add a HAVING clause to the query with NULL condition and OR condition
     *
     * @param string $column The column name to filter
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_having_null($column)
    {
        return $this->having_null($column, 'or');
    }

    /**
     * Add a HAVING clause to the query with NOT NULL condition
     *
     * @param string $columns The column name to filter
     * @param string $boolean The boolean operator (and, or)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function having_not_null($columns, $boolean = 'and')
    {
        return $this->having_null($columns, $boolean, true);
    }

    /**
     * Add a HAVING clause to the query with NOT NULL condition and OR condition
     *
     * @param string $column The column name to filter
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_having_not_null($column)
    {
        return $this->having_not_null($column, 'or');
    }

    /**
     * Add a HAVING clause to the query with BETWEEN condition
     *
     * @param string $column The column name to filter
     * @param array $values The values to compare against
     * @param string $boolean The boolean operator (and, or)
     * @param bool $not Whether the condition should be negated
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function having_between($column, $values, $boolean = 'and', $not = false)
    {
        $type = 'between';

        $this->havings[] = compact('type', 'column', 'values', 'boolean', 'not');

        $this->add_bindings(
            array_slice(
                $this->clean_bindings(Arr::flatten($values)),
                0,
                2
            ),
            'having'
        );

        return $this;
    }

    /**
     * Add a HAVING clause to the query with raw SQL condition
     *
     * This method adds a raw HAVING clause to the query. It's useful when you need to
     * group by a column that doesn't exist in the table.
     *
     * @param string $sql The raw SQL query to execute
     * @param array $bindings Parameter values to bind to the query
     * @param string $boolean The boolean operator to combine with previous conditions
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function having_raw($sql, array $bindings = [], $boolean = 'and')
    {
        $type = 'raw';

        $this->havings[] = compact('type', 'sql', 'boolean');

        $this->add_bindings($bindings, 'having');

        return $this;
    }

    /**
     * Add a HAVING clause to the query with raw SQL condition and OR condition
     *
     * This method adds a raw HAVING clause to the query using the OR boolean operator.
     * It functions identically to the having_raw() method but uses OR instead of AND to combine
     * with previous conditions.
     *
     * @param string $sql The raw SQL query to execute
     * @param array $bindings Parameter values to bind to the query
     * @param string $boolean The boolean operator to combine with previous conditions
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function or_having_raw($sql, array $bindings = [])
    {
        return $this->having_raw($sql, $bindings, 'or');
    }

    /**
     * Add a ORDER BY clause to sort query results
     *
     * This method adds a column to sort the query results by. Multiple ORDER BY clauses
     * can be chained to create multi-level sorting. The direction can be either 'ASC'
     * for ascending order or 'DESC' for descending order, with ascending being the default.
     *
     * @param mixed $column The column name to sort by
     * @param string $direction The sort direction (ASC or DESC)
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function order_by($column, $direction = 'asc')
    {
        if ($this->is_queryable($column)) {
            [$query, $bindings] = $this->create_subquery($column);

            $column = new Expression('(' . $query . ')');

            $this->add_bindings($bindings, 'order');
        }

        $direction = strtolower($direction);

        if (!in_array($direction, ['asc', 'desc'], true)) {
            throw new InvalidArgumentException('Order direction must be either "asc" or "desc".');
        }

        $this->orders[] = [
            'column' => $column,
            'direction' => $direction
        ];

        return $this;
    }

    /**
     * Add a ORDER BY clause to the query with DESC direction and latest
     *
     * This method adds a column to sort the query results by in descending order.
     *
     * @param string $column The column name to sort by
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function order_by_desc($column)
    {
        return $this->order_by($column, 'DESC');
    }

    /**
     * Add a ORDER BY clause to the query with DESC direction and oldest
     *
     * This method adds a column to sort the query results by in descending order.
     *
     * @param string $column The column name to sort by
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function latest($column = 'created_at')
    {
        return $this->order_by($column, 'DESC');
    }

    /**
     * Add a ORDER BY clause to the query with ASC direction and oldest
     *
     * This method adds a column to sort the query results by in ascending order.
     *
     * @param string $column The column name to sort by
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function oldest($column = 'created_at')
    {
        return $this->order_by($column, 'ASC');
    }

    /**
     * Set the maximum number of records to return
     *
     * This method limits the number of records returned by the query. It's commonly used
     * for pagination or when you only need a specific number of results. The limit is
     * applied after all filtering, joining, and sorting operations.
     *
     * @param int $limit The maximum number of records
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function limit($limit)
    {
        $this->limit = $limit;

        return $this;
    }

    /**
     * Alias for limit() method.
     *
     * @param int $limit The maximum number of records to return
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     */
    public function take($limit)
    {
        return $this->limit($limit);
    }

    /**
     * Alias for offset() method.
     *
     * @param int $value The number of records to skip
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     */
    public function skip($value)
    {
        return $this->offset($value);
    }

    /**
     * Set the number of records to skip before returning results
     *
     * This method sets the number of records to skip from the beginning of the result set.
     * It's typically used in conjunction with limit() for pagination purposes. The offset
     * is applied after sorting but before the limit.
     *
     * @param int $offset The number of records to skip
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function offset($offset)
    {
        $this->offset = $offset;

        return $this;
    }

    /**
     * Specify relationships to eager load with the query results
     *
     * This method configures which related models should be loaded along with the main query
     * results to prevent N+1 query problems. Relationships are loaded using the EagerLoader
     * and can significantly improve performance when accessing related data.
     *
     * @param array|string $relations The relationships to load
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function with($relations, $callback = null)
    {
        if (is_string($relations)) {
            $relations = func_get_args();
        }

        if (is_null($this->relations)) {
            $this->relations = [];
        }

        if ($callback instanceof Closure) {
            $relations = $this->parse_relations([$relations => $callback]);
        } else {
            $relations = $this->parse_relations(
                is_array($relations) ? $relations : func_get_args()
            );
        }


        $this->relations = array_merge($this->relations, $relations);

        return $this;
    }

    /**
     * Parse relations into a normalized nested structure.
     *
     * @param array $relations The relations to parse
     * @return array The parsed relations
     * @since 1.0.0
     */
    public function parse_relations($relations)
    {
        $parsed = [];

        foreach ($relations as $key => $value) {
            if (is_string($key)) {
                $this->parse_nested_relation($key, $parsed, $value);
                continue;
            }

            if (is_string($value)) {
                $this->parse_nested_relation($value, $parsed);
                continue;
            }

            if ($value instanceof Closure) {
                continue;
            }

            if (is_array($value)) {
                foreach ($value as $nested_key => $nested_value) {
                    is_numeric($nested_key)
                        ? $this->parse_nested_relation($nested_value, $parsed)
                        : $this->parse_nested_relation($nested_key, $parsed, $nested_value);
                }
            }
        }

        return $parsed;
    }

    /**
     * Parse a nested relation string or array into the parsed structure.
     *
     * @param string $relation The relation string (may contain dots)
     * @param array &$parsed The parsed relations array to update
     * @param mixed $nested The nested relations if any
     * @return void No return value
     * @since 1.0.0
     */
    public function parse_nested_relation($relation, &$parsed, $nested = null)
    {
        if (strpos($relation, '.') !== false) {
            $parts = explode('.', $relation);
            $root = array_shift($parts);
            $nested_relation = implode('.', $parts);

            if (!isset($parsed[$root])) {
                $parsed[$root] = [];
            }

            $this->parse_nested_relation($nested_relation, $parsed[$root], $nested);
        } else {
            $parsed[$relation] ??= [];

            if (is_array($nested)) {
                $nested_parsed = $this->parse_relations($nested);
                $parsed[$relation] = array_merge_recursive($parsed[$relation], $nested_parsed);
            } elseif (!empty($nested)) {
                $parsed[$relation][] = $nested;
            }
        }
    }

    /**
     * Specify casts for the query results
     *
     * This method configures which attributes should be cast to a specific type when
     * loading the query results. This is useful for ensuring that attributes are
     * cast to the correct type, such as dates, booleans, or other custom types.
     *
     * @param array $casts The attributes to cast
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     *
     * @since 1.0.0
     */
    public function with_casts($casts)
    {
        $this->model->merge_casts($casts);

        return $this;
    }

    /**
     * Call a scope on the query
     * 
     * @param callable $scope The scope to call
     * @param array $parameters The parameters to pass to the scope
     * 
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     * 
     * @since 1.0.0
     */
    public function call_scope(callable $scope, array $parameters = [])
    {
        array_unshift($parameters, $this);

        $query = $this;

        $original_with_count = is_null($query->wheres) ? 0 : count($query->wheres);

        $result = $scope(...$parameters) ?? $this;

        if (count((array) $query->wheres) > $original_with_count) {
            $this->add_new_wheres_within_groups($query, $original_with_count);
        }

        return $result;
    }

    /**
     * Add new wheres from the given query to the current query within a new group
     *
     * @param QueryBuilder $query The query to get new wheres from
     * @param int $original_with_count The original count of wheres in the current query
     * @return void No return value
     * @since 1.0.0
     */
    protected function add_new_wheres_within_groups(QueryBuilder $query, int $original_with_count)
    {
        $all_wheres = $query->wheres;
        $query->wheres = [];

        $this->group_where_slice_for_scope($query, array_slice($all_wheres, 0, $original_with_count));
        $this->group_where_slice_for_scope($query, array_slice($all_wheres, $original_with_count));
    }

    /**
     * Group where slice for scope
     * 
     * @param QueryBuilder $query The query builder instance to group where slice for
     * @param array $where_slice The where slice to group
     * 
     * @return void No return value
     * 
     * @since 1.0.0
     */
    protected function group_where_slice_for_scope(QueryBuilder $query, $where_slice)
    {
        $where_booleans = collection($where_slice)->pluck('boolean');

        if ($where_booleans->contains(fn($operator) => str_contains($operator, 'or'))) {
            $query->wheres[] = $this->create_nested_where(
                $where_slice,
                str_replace(' not', '', $where_booleans->first())
            );
        } else {
            $query->wheres = array_merge($query->wheres, $where_slice);
        }
    }

    /**
     * Create a nested where clause
     * 
     * @param array $where_slice The where slice to create nested where clause for
     * @param string $boolean The boolean operator (and, or)
     * 
     * @return array Returns the nested where clause
     * 
     * @since 1.0.0
     */
    protected function create_nested_where($where_slice, $boolean = 'and')
    {
        $where_group = $this->for_nested_where();
        $where_group->wheres = $where_slice;

        return [
            'type' => 'nested',
            'query' => $where_group,
            'boolean' => $boolean
        ];
    }

    /**
     * Get the placeholder for a value based on its type
     *
     * @param mixed $value The value to get the placeholder for
     *
     * @return string The placeholder for the value
     */
    protected function get_placeholder_by_value($value): string
    {
        if (is_null($value)) {
            return 'NULL';
        } elseif (is_int($value)) {
            return '%d';
        } elseif (is_float($value)) {
            return '%f';
        }

        return '%s';
    }

    /**
     * Convert the binding values into prepare statement ready placeholders.
     * This is mainly generating %s,%d,%f placeholders for the query.
     *
     * @param array $bindings
     * @return array
     *
     * @since 1.0.0
     */
    protected function prepare_binding_placeholders($bindings)
    {
        if (!is_array($bindings) || empty($bindings)) {
            return [];
        }

        $placeholders = [];

        foreach ($bindings as $binding) {
            $placeholders[] = $this->get_placeholder_by_value($binding);
        }

        return $placeholders;
    }

    /**
     * Execute the query and return all matching records as a collection
     *
     * This method executes the built SELECT query and returns all matching records.
     * If a model class is configured, the results are hydrated into model instances.
     * If eager loading relationships are specified, they are loaded to prevent N+1
     * query problems. The final results are wrapped in a Collection instance.
     *
     * @return Collection A collection of model instances or raw data
     *
     * @since 1.0.0
     */
    public function get($columns = ['*'])
    {
        $columns = is_array($columns) ? $columns : func_get_args();

        $results = $this->once_with_columns(
            Arr::wrap($columns),
            fn() => $this->run_select()
        );

        if (!$this->model) {
            return collection($results);
        }

        $models = array_map(fn($item) => $this->model->hydrate($item), $results);

        return $this->eager_load_relations($models);
    }

    /**
     * Eager load the relationships for the collection.
     *
     * @param array $models The models to eager load
     * @return Collection A new collection containing the eager loaded items
     * @since 1.0.0
     */
    public function eager_load_relations(array $models)
    {
        if (!empty($this->relations) && !empty($models) && static::$should_resolve_relations) {
            $models = Relation::without_constraints(
                fn() => (new EagerLoader($models, $this->relations))->load()
            );
        }

        return collection($models);
    }

    /**
     * Temporarily disable resolving relations for the duration of the callback.
     *
     * @param Closure $callback The callback to execute with resolving relations disabled
     * @return mixed The return value of the callback
     * @since 1.0.0
     */
    protected static function without_resolving_relations(Closure $callback)
    {
        $previous = static::$should_resolve_relations;
        static::$should_resolve_relations = false;

        try {
            $result = $callback();
        } finally {
            static::$should_resolve_relations = $previous;
        }

        return $result;
    }

    /**
     * Execute the query and return the results with the specified columns
     *
     * @param array $columns The columns to select
     * @param callable $callback The callback function to execute
     *
     * @return mixed The results of the query
     */
    protected function once_with_columns($columns, $callback)
    {
        $original = $this->columns;

        if (is_null($original)) {
            $this->columns = $columns;
        }

        $result = $callback();

        $this->columns = $original;

        return $result;
    }

    /**
     * Execute the query and return the results
     *
     * @return array The results of the query
     */
    protected function run_select()
    {
        return $this->connection->select(
            $this->to_sql(),
            $this->get_bindings(),
        );
    }

    /**
     * Execute the query and return the first matching record
     *
     * This method executes the query with a limit of 1 and returns only the first
     * matching record. If a model class is configured, the result is hydrated into
     * a model instance. If no records match the query conditions, null is returned.
     *
     * @return mixed The first model instance or raw data record, or null if no results
     *
     * @since 1.0.0
     */
    public function first($columns = ['*'])
    {
        return $this->take(1)->get($columns)->first();
    }

    /**
     * Execute the query and return the first matching record or throw an exception if no record is found.
     *
     * @param array $columns The columns to select
     * @return mixed The first model instance or raw data record
     * @throws ModelNotFoundException If no record is found
     * 
     * @since 1.0.0
     */
    public function first_or_fail($columns = ['*'])
    {
        if (!is_null($model = $this->first($columns))) {
            return $model;
        }

        throw new ModelNotFoundException(get_class($this->model));
    }

    /**
     * Pluck the values from the results
     *
     * @param string $column The column to pluck from
     * @param string $key The key to pluck from
     *
     * @return Collection The plucked values
     *
     * @since 1.0.0
     */
    public function pluck($column, $key = null)
    {
        $results = $this->once_with_columns(
            is_null($key) ? [$column] : [$column, $key],
            function () {
                return $this->run_select();
            }
        );

        if (empty($results)) {
            return collection();
        }

        $column = $this->strip_table_for_pluck($column);
        $key = $this->strip_table_for_pluck($key);

        return is_array($results[0])
            ? $this->pluck_from_array($results, $column, $key)
            : $this->pluck_from_object($results, $column, $key);
    }

    /**
     * Strip the table name from the column name
     *
     * @param string $column The column name
     *
     * @return string The column name without the table name
     *
     * @since 1.0.0
     */
    protected function strip_table_for_pluck($column)
    {
        if (is_null($column)) {
            return null;
        }

        $column_string = $column instanceof Expression
            ? $this->compiler->get_value($column)
            : $column;

        $separator = str_contains(strtolower($column_string), ' as ') ? ' as ' : '\.';
        $parts = Str::split($separator, $column_string);

        return end($parts);
    }

    /**
     * Pluck the values from the results array
     *
     * @param array $results The results to pluck from
     * @param string $column The column to pluck from
     * @param string $key The key to pluck from
     *
     * @return Collection The plucked values
     */
    protected function pluck_from_array($results, $column, $key)
    {
        $data = [];

        if (is_null($key)) {
            foreach ($results as $result) {
                $data[] = $result[$column];
            }
        } else {
            foreach ($results as $result) {
                $data[$result[$key]] = $result[$column];
            }
        }

        return collection($data);
    }

    /**
     * Pluck the values from the results object
     *
     * @param array $results The results to pluck from
     * @param string $column The column to pluck from
     * @param string $key The key to pluck from
     *
     * @return Collection The plucked values
     */
    protected function pluck_from_object($results, $column, $key)
    {
        $data = [];

        if (is_null($key)) {
            foreach ($results as $result) {
                $data[] = $result->$column;
            }
        } else {
            foreach ($results as $result) {
                $data[$result->$key] = $result->$column;
            }
        }

        return collection($data);
    }

    /**
     * Find a record by its primary key value
     *
     * This method is a convenience method for finding a single record by its primary key.
     * It adds a WHERE condition for the specified column (defaulting to 'id') and returns
     * the first matching record. This is commonly used for retrieving specific records
     * when you know their unique identifier.
     *
     * @param mixed $id The primary key value to search for
     * @param string $column The column name to search (defaults to 'id')
     *
     * @return mixed The model instance or raw data record, or null if not found
     *
     * @since 1.0.0
     */
    public function find($id, $column = 'id')
    {
        return $this->where($column, '=', $id)->first();
    }

    /**
     * Count the total number of records that match the query conditions
     *
     * This method executes a COUNT query to determine the total number of records
     * that match the current query conditions. It temporarily modifies the SELECT
     * clause to use COUNT() and then restores the original columns. This is useful
     * for pagination and determining result set sizes without fetching all data.
     *
     * @param string $columns The column to count (defaults to '*' for all records)
     *
     * @return int The total count of matching records
     *
     * @since 1.0.0
     */
    public function count($columns = '*')
    {
        return (int) $this->aggregate(__FUNCTION__, Arr::wrap($columns));
    }

    /**
     * Calculate the sum of values in a specified column
     *
     * This method calculates the sum of all non-null values in the specified column
     * for records that match the current query conditions. It uses the SUM aggregate
     * function and is useful for calculating totals, such as total sales or quantities.
     *
     * @param string $column The column name to sum
     *
     * @return mixed The sum of all values in the column
     *
     * @since 1.0.0
     */
    public function sum($column)
    {
        return $this->aggregate(__FUNCTION__, Arr::wrap($column)) ?: 0;
    }

    /**
     * Calculate the average value of a specified column
     *
     * This method calculates the average (arithmetic mean) of all non-null values
     * in the specified column for records that match the current query conditions.
     * It uses the AVG aggregate function and is useful for statistical analysis
     * and reporting average values.
     *
     * @param string $column The column name to average
     *
     * @return mixed The average value of the column
     *
     * @since 1.0.0
     */
    public function avg($column)
    {
        return $this->aggregate(__FUNCTION__, Arr::wrap($column));
    }

    /**
     * Find the minimum value in a specified column
     *
     * This method finds the smallest value in the specified column for records
     * that match the current query conditions. It uses the MIN aggregate function
     * and can be used with numeric, date, or string columns to find the lowest value.
     *
     * @param string $column The column name to find minimum value
     *
     * @return mixed The minimum value in the column
     *
     * @since 1.0.0
     */
    public function min($column)
    {
        return $this->aggregate(__FUNCTION__, Arr::wrap($column));
    }

    /**
     * Find the maximum value in a specified column
     *
     * This method finds the largest value in the specified column for records
     * that match the current query conditions. It uses the MAX aggregate function
     * and can be used with numeric, date, or string columns to find the highest value.
     *
     * @param string $column The column name to find maximum value
     *
     * @return mixed The maximum value in the column
     *
     * @since 1.0.0
     */
    public function max($column)
    {
        return $this->aggregate(__FUNCTION__, Arr::wrap($column));
    }

    /**
     * Execute an aggregate function on a column and return the result
     *
     * This protected method provides a generic way to execute aggregate functions
     * (SUM, AVG, MIN, MAX) on a specified column. It temporarily modifies the SELECT
     * clause to use the aggregate function, executes the query, and then restores
     * the original column selection.
     *
     * @param string $function The aggregate function to apply (SUM, AVG, MIN, MAX)
     * @param string $column The column name to apply the function to
     *
     * @return mixed The result of the aggregate function
     *
     * @since 1.0.0
     */
    public function aggregate($function, $columns = ['*'])
    {
        $results = $this->without_resolving_relations(function () use ($function, $columns) {
            return $this->clone_without($this->havings ? [] : ['columns'])
                ->clone_without_bindings($this->havings ? [] : ['select'])
                ->set_aggregate($function, $columns)
                ->get();
        });

        if (!$results->is_empty()) {
            return array_change_key_case($results->to_array())[0]['aggregate'];
        }
    }

    /**
     * Set the aggregate function and columns for the query
     *
     * @param string $function The aggregate function to apply (SUM, AVG, MIN, MAX)
     * @param string $columns The columns to apply the function to
     *
     * @return QueryBuilder Returns the QueryBuilder instance for method chaining
     */
    protected function set_aggregate($function, $columns)
    {
        $this->aggregate = compact('function', 'columns');

        if (empty($this->groups)) {
            $this->orders = null;
            $this->bindings['order'] = [];
        }

        return $this;
    }

    /**
     * Execute an aggregate function on a column and return the result as a numeric value
     *
     * @param string $function The aggregate function to apply (SUM, AVG, MIN, MAX)
     * @param string $columns The columns to apply the function to
     *
     * @return mixed The result of the aggregate function
     */
    public function numeric_aggregate($function, $columns = ['*'])
    {
        $result = $this->aggregate($function, $columns);

        if (!$result) {
            return 0;
        }

        if (is_int($result) || is_float($result)) {
            return $result;
        }

        return !str_contains((string) $result, '.')
            ? (int) $result
            : (float) $result;
    }

    /**
     * Insert a new record into the table with the provided data
     *
     * This method creates an INSERT statement to add a new record to the database.
     * The data array should contain column names as keys and their corresponding
     * values. All values are properly bound to prevent SQL injection attacks.
     * Returns true if the insert was successful, false otherwise.
     *
     * @param array $data Associative array of column names and values to insert
     *
     * @return bool True if the insert was successful, false otherwise
     *
     * @since 1.0.0
     */
    public function insert(array $values)
    {
        if (empty($values)) {
            return true;
        }

        if (!is_array(reset($values))) {
            $values = [$values];
        } else {
            foreach ($values as $key => $value) {
                ksort($value);
                $values[$key] = $value;
            }
        }

        return $this->connection->insert(
            $this->compiler->compile_insert($this, $values),
            $this->clean_bindings(Arr::flatten($values, 1))
        );
    }

    /**
     * Update the records that match the query conditions with new data.
     *
     * @param array $values The values to update.
     *
     * @return int The number of rows affected by the update operation.
     */
    public function update(array $values)
    {
        $values = collection($values)->map(function ($value) {
            if (!$value instanceof QueryBuilder) {
                return [
                    'value' => $value,
                    'bindings' => $value instanceof Collection ? $value->all() : $value,
                ];
            }

            [$query, $bindings] = $this->parse_subquery($value);

            return [
                'value' => new Expression(sprintf('(%s)', $query)),
                'bindings' => $bindings,
            ];
        });

        $sql = $this->compiler->compile_update(
            $this,
            $values->map(function ($value) {
                return $value['value'];
            })->all()
        );

        $bindings = $this->clean_bindings(
            $this->compiler->prepare_bindings_for_update(
                $this->bindings,
                $values->map(function ($value) {
                    return $value['bindings'];
                })->all()
            )
        );

        return $this->connection->update($sql, $bindings);
    }

    /**
     * Delete the records that match the query conditions.
     *
     * @return bool|int The number of rows affected by the delete operation, or false on failure.
     *
     * @since 1.0.0
     */
    public function delete()
    {
        return $this->connection->delete(
            $this->compiler->compile_delete($this),
            $this->clean_bindings($this->compiler->prepare_bindings_for_delete($this->bindings))
        );
    }

    /**
     * Insert a new record and return the auto-generated primary key
     *
     * This method performs an insert operation and then retrieves the auto-generated
     * primary key value (typically from an AUTO_INCREMENT column). This is useful
     * when you need to know the ID of the newly created record for further operations
     * or to establish relationships with other records.
     *
     * @param array $data Associative array of column names and values to insert
     *
     * @return int The last inserted ID
     *
     * @since 1.0.0
     */
    public function insert_get_id(array $values)
    {
        $result = $this->insert($values);

        if (!$result) {
            return 0;
        }

        // This will return the last insert id after the insert operation.
        // But for multiple inserts, it will return the first attempt id
        // So, use this with caution.
        return (int) $this->connection->get_db()->insert_id;
    }

    /**
     * Increment the value of the given column by the given amount.
     *
     * @param string $column The column to increment.
     * @param int $amount The amount to increment the column by.
     * @param array $extra The extra columns to update.
     *
     * @return bool True if the increment was successful, false otherwise.
     */
    public function increment($column, $amount = 1, array $extra = [])
    {
        if (!is_numeric($amount)) {
            throw new InvalidArgumentException('Non-numeric value passed to increment method.');
        }

        return $this->increment_each([$column => $amount], $extra);
    }

    /**
     * Increment the values of the given columns by the given amount.
     *
     * @param array $columns The columns to increment.
     * @param array $extra The extra columns to update.
     *
     * @return bool True if the increment was successful, false otherwise.
     */
    public function increment_each(array $columns, array $extra = [])
    {
        foreach ($columns as $column => $amount) {
            if (!is_numeric($amount)) {
                throw new InvalidArgumentException('Non-numeric value passed to increment method.');
            } elseif (!is_string($column)) {
                throw new InvalidArgumentException('Invalid column provided to increment method.');
            }

            $columns[$column] = $this->raw(
                sprintf(
                    '%s + %s',
                    $this->compiler->wrap($column),
                    $amount
                )
            );
        }

        return $this->update(array_merge($columns, $extra));
    }

    /**
     * Decrement the value of the given column by the given amount.
     *
     * @param string $column The column to decrement.
     * @param int $amount The amount to decrement the column by.
     * @param array $extra The extra columns to update.
     *
     * @return bool True if the decrement was successful, false otherwise.
     */
    public function decrement($column, $amount = 1, array $extra = [])
    {
        if (!is_numeric($amount)) {
            throw new InvalidArgumentException('Non-numeric value passed to increment method.');
        }

        return $this->decrement_each([$column => $amount], $extra);
    }

    /**
     * Decrement the values of the given columns by the given amount.
     *
     * @param array $columns The columns to decrement.
     * @param array $extra The extra columns to update.
     *
     * @return bool True if the decrement was successful, false otherwise.
     */
    public function decrement_each(array $columns, array $extra = [])
    {
        foreach ($columns as $column => $amount) {
            if (!is_numeric($amount)) {
                throw new InvalidArgumentException('Non-numeric value passed to increment method.');
            } elseif (!is_string($column)) {
                throw new InvalidArgumentException('Invalid column provided to increment method.');
            }

            $columns[$column] = $this->raw(
                sprintf(
                    '%s - %s',
                    $this->compiler->wrap($column),
                    $amount
                )
            );
        }

        return $this->update(array_merge($columns, $extra));
    }

    /**
     * Get the sole record from the query.
     *
     * @param array $columns The columns to select.
     *
     * @return mixed The sole record.
     *
     * @throws RecordNotFoundException If no record is found.
     * @throws MultipleRecordsFoundException If multiple records are found.
     */
    public function sole($columns = ['*'])
    {
        $result = $this->take(2)->get($columns);

        $count = $result->count();

        if ($count === 0) {
            throw new RecordNotFoundException();
        }

        if ($count > 1) {
            throw new MultipleRecordsFoundException($count);
        }

        return $result->first();
    }

    /**
     * Create a new raw expression.
     *
     * @param string $value The value to create a raw expression from.
     *
     * @return Expression The raw expression.
     */
    public function raw($value)
    {
        return $this->connection->raw($value);
    }

    /**
     * Set the page and per_page for the query.
     *
     * @param int $page The page number.
     * @param int $per_page The number of records per page.
     *
     * @return QueryBuilder The query builder instance.
     */
    public function for_page($page, $per_page = self::PAGINATION_LIMIT)
    {
        return $this->offset(($page - 1) * $per_page)->limit($per_page);
    }

    /**
     * Get the records for a page before a given ID.
     *
     * @param int $per_page The number of records per page.
     * @param int $last_id The last ID to get records before.
     * @param string $column The column to get records before.
     *
     * @return $this Returns the QueryBuilder instance for method chaining
     */
    public function for_page_before_id($per_page = self::PAGINATION_LIMIT, $last_id = 0, $column = 'id')
    {
        $this->orders = $this->remove_existing_orders_for($column);

        if (is_null($last_id)) {
            $this->where_not_null($column);
        } else {
            $this->where($column, '<', $last_id);
        }

        return $this->order_by($column, 'desc')
            ->limit($per_page);
    }

    /**
     * Get the records for a page after a given ID.
     *
     * @param int $per_page The number of records per page.
     * @param int $last_id The last ID to get records after.
     * @param string $column The column to get records after.
     *
     * @return $this Returns the QueryBuilder instance for method chaining
     */
    public function for_page_after_id($per_page = self::PAGINATION_LIMIT, $last_id = 0, $column = 'id')
    {
        $this->orders = $this->remove_existing_orders_for($column);

        if (is_null($last_id)) {
            $this->where_not_null($column);
        } else {
            $this->where($column, '>', $last_id);
        }

        return $this->order_by($column, 'asc')
            ->limit($per_page);
    }

    /**
     * Remove the existing orders for the given column.
     *
     * @param string $column The column to remove the existing orders for.
     *
     * @return array|null The existing orders without the given column.
     */
    protected function remove_existing_orders_for($column)
    {
        if (is_null($this->orders)) {
            return null;
        }

        return collection($this->orders)
            ->filter(fn($order) => $order['column'] !== $column)
            ->values()
            ->all();
    }

    /**
     * Enforce the order by primary key.
     *
     * @return void
     */
    protected function enforce_order_by_primary_key()
    {
        if (empty($this->orders) && $this->model) {
            $this->order_by(
                $this->model->prepare_column($this->model->get_primary_key()),
                'asc'
            );
        }
    }

    /**
     * Reorder the query results.
     *
     * @param string $column The column to reorder by.
     * @param string $direction The direction to reorder by.
     *
     * @return QueryBuilder The query builder instance.
     */
    public function reorder($column = null, $direction = 'asc')
    {
        $this->orders = null;
        $this->bindings['order'] = [];

        if ($column) {
            return $this->order_by($column, $direction);
        }

        return $this;
    }

    /**
     * Paginate the query results and return a paginator instance
     *
     * This method implements pagination by counting the total records, calculating
     * the appropriate offset, and limiting the results. It returns a Paginator
     * instance that contains the current page's results along with pagination
     * metadata such as total pages, current page, and navigation information.
     *
     * @param int $per_page Number of records per page
     * @param int $page Current page number
     *
     * @return Paginator A paginator instance with the results and pagination info
     *
     * @since 1.0.0
     */
    public function paginate($per_page = 15, $page = null, $columns = ['*'], $total = null)
    {
        $columns = Arr::wrap($columns);
        $page = $page ?: 1;
        $total = $total ?? $this->get_count_for_pagination();

        $results = $total
            ? $this->for_page($page, $per_page)->get($columns)
            : collection();

        return new Paginator($results, $total, $per_page, $page);
    }

    /**
     * Get the count for pagination.
     *
     * @param array $columns The columns to count.
     *
     * @return int The count for pagination.
     */
    protected function get_count_for_pagination($columns = ['*'])
    {
        $results = $this->run_pagination_count_query($columns);

        if (!isset($results[0])) {
            return 0;
        } elseif (is_object($results[0])) {
            return (int) $results[0]->aggregate;
        }

        return (int) array_change_key_case((array) $results[0])['aggregate'];
    }

    /**
     * Run the pagination count query.
     *
     * @param array $columns The columns to count.
     *
     * @return array The results of the count query.
     */
    protected function run_pagination_count_query($columns = ['*'])
    {
        if ($this->havings || $this->groups) {
            $clone = $this->clone_for_pagination_count();

            if (is_null($clone->columns) && !empty($this->joins)) {
                $clone->select($this->from . '.*');
            }

            return $this->new_query()
                ->from(new Expression('(' . $clone->to_sql() . ') as ' . $this->compiler->wrap('aggregate_table')))
                ->merge_bindings($clone)
                ->set_aggregate('count', $this->without_select_aliases($columns))
                ->get()->all();
        }

        $without = ['columns', 'orders', 'limit', 'offset'];

        $result = static::without_resolving_relations(function () use ($without, $columns) {
            return $this->clone_without($without)
                ->clone_without_bindings(['select', 'order'])
                ->set_aggregate('count', $this->without_select_aliases($columns))
                ->get()->all();
        });

        return $result;
    }

    /**
     * Clone the query for pagination count.
     *
     * @return QueryBuilder The cloned query builder instance.
     */
    protected function clone_for_pagination_count()
    {
        return $this->clone_without(['orders', 'limit', 'offset'])
            ->clone_without_bindings(['order']);
    }

    /**
     * Merge the bindings of the query.
     *
     * @param QueryBuilder $query The query to merge the bindings with.
     *
     * @return QueryBuilder The query builder instance.
     */
    protected function merge_bindings(self $query)
    {
        $this->bindings = array_merge_recursive($this->bindings, $query->bindings);

        return $this;
    }

    /**
     * Remove the select aliases from the columns.
     *
     * @param array $columns The columns to remove the aliases from.
     *
     * @return array The columns without the aliases.
     */
    protected function without_select_aliases(array $columns)
    {
        return array_map(function ($column) {
            return is_string($column) && ($alias_position = stripos($column, ' as ')) !== false
                ? substr($column, 0, $alias_position) : $column;
        }, $columns);
    }

    /**
     * Get the relationships that are set to be eager loaded
     *
     * This method returns the array of relationship names that have been configured
     * for eager loading through the with() method. This information can be useful
     * for debugging or introspection of the query builder's current state.
     *
     * @return array Array of relationship names to be loaded
     *
     * @since 1.0.0
     */
    public function get_with_relations()
    {
        return $this->relations;
    }

    /**
     * Get the database connection instance
     *
     * This method returns the database connection instance that the query builder
     * is using to execute queries. This can be useful for accessing connection-specific
     * methods or for debugging connection-related issues.
     *
     * @return Connection The database connection instance
     *
     * @since 1.0.0
     */
    public function get_connection()
    {
        return $this->connection;
    }

    /**
     * Get the table name being queried
     *
     * This method returns the name of the database table that the query builder
     * is currently configured to query against. This can be useful for debugging
     * or for dynamic query building scenarios.
     *
     * @return string The table name
     *
     * @since 1.0.0
     */
    public function get_table()
    {
        return $this->from;
    }

    /**
     * Get the SQL query string without executing it
     *
     * This method returns the compiled SQL query string that would be executed
     * by the get() or other execution methods. This is useful for debugging,
     * logging, or inspecting the generated SQL before execution. Note that
     * parameter placeholders (?) will still be present in the returned string.
     *
     * @return string The compiled SQL query string
     *
     * @since 1.0.0
     */
    public function to_sql()
    {
        return $this->compiler->compile_select($this);
    }

    /**
     * Get the SQL query string with bindings substituted into it.
     *
     * @return string The SQL query string with bindings substituted into it.
     *
     * @since 1.0.0
     */
    public function to_sql_debug()
    {
        return $this->compiler->substitute_bindings_into_raw_sql(
            $this->to_sql(),
            $this->connection->prepare_bindings(
                $this->get_bindings()
            )
        );
    }

    /**
     * Get all parameter bindings for the current query
     *
     * This method returns an array of all parameter values that will be bound
     * to the SQL query when it's executed. The values are in the order they
     * appear in the query and correspond to the parameter placeholders (?).
     * This is useful for debugging and query introspection.
     *
     * @return array Array of parameter values to be bound to the query
     *
     * @since 1.0.0
     */
    public function get_bindings()
    {
        return Arr::flatten($this->bindings);
    }

    /**
     * Get all raw bindings for the current query
     *
     * @return array Array of raw bindings
     *
     * @since 1.0.0
     */
    public function get_raw_bindings()
    {
        return $this->bindings;
    }

    public function get_binding($type)
    {
        return $this->bindings[$type];
    }

    public function clean_bindings(array $bindings)
    {
        return collection($bindings)
            ->filter(fn($binding) => !$binding instanceof Expression)
            ->values()
            ->all();
    }

    /**
     * Check if the query has a binding for a given type
     *
     * @param string $type The type of binding to check
     *
     * @return bool True if the query has a binding for the given type, false otherwise
     *
     * @since 1.0.0
     */
    protected function bindings_exists(string $type)
    {
        return array_key_exists($type, $this->bindings);
    }

    /**
     * Check if the query has a binding for a given type
     *
     * @param string $type The type of binding to check
     *
     * @return bool True if the query has a binding for the given type, false otherwise
     *
     * @since 1.0.0
     */
    protected function has_bindings(string $type)
    {
        return $this->bindings_exists($type) && !empty($this->bindings[$type]);
    }

    /**
     * Create a new query builder instance
     *
     * @return QueryBuilder
     *
     * @since 1.0.0
     */
    public function new_query()
    {
        return new static($this->connection, $this->compiler, $this->model);
    }

    /**
     * Qualify a column name with the table name
     *
     * @param string|Expression $column The column name to qualify
     *
     * @return string The qualified column name
     *
     * @since 1.0.0
     */
    public function qualify_column($column)
    {
        $column = $column instanceof Expression
            ? $column->get_value()
            : $column;

        return $this->model->prepare_column($column);
    }

    /**
     * Create a new query builder instance for a sub-query
     *
     * @return QueryBuilder
     *
     * @since 1.0.0
     */
    protected function for_subquery()
    {
        return $this->new_query();
    }

    /**
     * Check if the value is queryable
     *
     * @param mixed $value The value to check
     *
     * @return bool True if the value is queryable, false otherwise
     */
    protected function is_queryable($value)
    {
        return $value instanceof self ||
            $value instanceof Relation ||
            $value instanceof Closure;
    }

    /**
     * Create a subquery from a closure or query builder instance
     *
     * @param Closure|QueryBuilder $query The subquery to create
     *
     * @return array [sql, bindings]
     */
    protected function create_subquery($query)
    {
        if ($query instanceof Closure) {
            $callback = $query;

            $callback($query = $this->new_query());
        }

        return $this->parse_subquery($query);
    }

    /**
     * Parse a subquery into a SQL string and bindings
     *
     * @param Closure|QueryBuilder $query The subquery to parse
     *
     * @return array [sql, bindings]
     */
    protected function parse_subquery($query)
    {
        if ($query instanceof self) {
            return [$query->to_sql(), $query->get_bindings()];
        } elseif (is_string($query)) {
            return [$query, []];
        } else {
            throw new InvalidArgumentException(
                'Invalid subquery provided'
            );
        }
    }

    /**
     * Check if the operator is invalid
     *
     * @param string $operator The operator to check
     *
     * @return bool True if the operator is invalid, false otherwise
     */
    protected function is_invalid_operator($operator)
    {
        return !is_string($operator) ||
            !in_array(strtolower($operator), $this->operators, true);
    }

    /**
     * Check if the operator and value are invalid
     *
     * @param string $operator The operator to check
     * @param mixed $value The value to check
     *
     * @return bool True if the operator and value are invalid, false otherwise
     */
    protected function is_invalid_operator_and_value($operator, $value)
    {
        return is_null($value) &&
            in_array(strtolower($operator), $this->operators, true) &&
            !in_array(strtolower($operator), ['=', '<>', '!=']);
    }

    /**
     * Prepare the value and operator
     *
     * @param mixed $value The value to prepare
     * @param string $operator The operator to prepare
     * @param bool $use_default Whether to use the default operator
     *
     * @return array The prepared value and operator
     */
    protected function prepare_value_and_operator($value, $operator, $use_default = false)
    {
        if ($use_default) {
            return [$operator, '='];
        } elseif ($this->is_invalid_operator_and_value($operator, $value)) {
            throw new InvalidArgumentException('Illegal operator and value combination.');
        }

        return [$value, $operator];
    }

    /**
     * Flatten the value
     *
     * @param mixed $value The value to flatten
     *
     * @return mixed The flattened value
     */
    protected function flatten_value($value)
    {
        $flatten = Arr::flatten($value);

        return is_array($value) ? reset($flatten) : $value;
    }

    /**
     * Clone the query builder
     *
     * @return QueryBuilder The cloned query builder
     */
    public function clone()
    {
        return clone $this;
    }

    /**
     * Clone the query builder without the specified properties
     *
     * @param array $properties The properties to clone without
     *
     * @return QueryBuilder The cloned query builder
     */
    protected function clone_without(array $properties)
    {
        $cloned = $this->clone();

        foreach ($properties as $property) {
            $cloned->$property = null;
        }

        return $cloned;
    }

    /**
     * Clone the query builder without the specified bindings
     *
     * @param array $except The bindings to clone without
     *
     * @return QueryBuilder The cloned query builder
     */
    public function clone_without_bindings(array $except)
    {
        $cloned = $this->clone();

        foreach ($except as $type) {
            $cloned->bindings[$type] = [];
        }

        return $cloned;
    }

    /**
     * Check if the query has a named scope.
     *
     * @param string $scope The scope name to check
     * @return bool True when the scope exists; false otherwise
     * @since 1.0.0
     */
    protected function has_named_scope(string $scope)
    {
        return $this->model && $this->model->has_named_scope($scope);
    }

    /**
     * Call a named scope on the model.
     *
     * @param string $scope The scope name to call
     * @param array $parameters The parameters to pass to the scope
     * @return mixed The result of the scope call
     * @since 1.0.0
     */
    protected function call_named_scope(string $scope, array $parameters = [])
    {
        array_unshift($parameters, $this);

        return $this->model->call_named_scope($scope, ...$parameters) ?? $this;
    }

    /**
     * Dynamically handle calls to the class
     *
     * @param string $method The method name
     * @param array $arguments The arguments for the method
     *
     * @return mixed The result of the method call
     * 
     * @since 1.0.0
     */
    public function __call(string $method, array $parameters)
    {
        if (static::has_macro($method)) {
            return $this->macroCall($method, $parameters);
        }

        if ($this->has_named_scope($method)) {
            return $this->call_named_scope($method, $parameters);
        }

        throw new BadMethodCallException(
            sprintf('Method %s::%s does not exist.', QueryBuilder::class, esc_html($method))
        );
    }
}
