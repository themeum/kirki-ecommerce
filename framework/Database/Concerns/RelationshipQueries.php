<?php

namespace Kirki\Ecommerce\Database\Concerns;

use Closure;
use Kirki\Ecommerce\Database\Query\Expression;
use Kirki\Ecommerce\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Database\Query\Relations\Relation;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Supports\Str;

use function Kirki\Ecommerce\collection;

trait RelationshipQueries
{
    /**
     * Add a count aggregate query to the query.
     *
     * @param string|array $relations The relations to count
     * 
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    public function with_count($relations)
    {
        return $this->with_aggregate(is_array($relations) ? $relations : func_get_args(), '*', 'count');
    }

    /**
     * Add a max aggregate query to the query.
     *
     * @param string|array $relation The relation to max
     * @param string $column The column to max
     * 
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    public function with_max($relation, $column)
    {
        return $this->with_aggregate($relation, $column, 'max');
    }

    /**
     * Add a min aggregate query to the query.
     *
     * @param string|array $relation The relation to min
     * @param string $column The column to min
     * 
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    public function with_min($relation, $column)
    {
        return $this->with_aggregate($relation, $column, 'min');
    }

    /**
     * Add an avg aggregate query to the query.
     *
     * @param string|array $relation The relation to avg
     * @param string $column The column to avg
     * 
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    public function with_avg($relation, $column)
    {
        return $this->with_aggregate($relation, $column, 'avg');
    }

    /**
     * Add a sum aggregate query to the query.
     *
     * @param string|array $relation The relation to sum
     * @param string $column The column to sum
     * 
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    public function with_sum($relation, $column)
    {
        return $this->with_aggregate($relation, $column, 'sum');
    }

    /**
     * Add an exists aggregate query to the query.
     *
     * @param string|array $relation The relation to exists
     * 
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    public function with_exists($relation)
    {
        return $this->with_aggregate($relation, '*', 'exists');
    }

    /**
     * Add a has aggregate query to the query.
     *
     * @param string|array $relation The relation to has
     * @param string $operator The operator to use
     * @param int $count The count to use
     * @param string $boolean The boolean to use
     * @param Closure $callback The callback to use
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function where_has($relation, ?Closure $callback = null, $operator = '>=', $count = 1)
    {
        return $this->has($relation, $operator, $count, 'and', $callback);
    }

    /**
     * Add a where has query to the query.
     *
     * @param string $relation The relation to check
     * @param Closure $callback The callback to use
     * @param string $operator The operator to use
     * @param int $count The count to use
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function with_where_has($relation, ?Closure $callback = null, $operator = '>=', $count = 1)
    {
        return $this->where_has($relation, $callback, $operator, $count)
            ->with($callback ? [$relation => fn($query) => $callback($query)] : $relation);
    }

    /**
     * Add an or where has query to the query.
     *
     * @param string|array $relation The relation to check
     * @param Closure $callback The callback to use
     * @param string $operator The operator to use
     * @param int $count The count to use
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function or_where_has($relation, ?Closure $callback = null, $operator = '>=', $count = 1)
    {
        return $this->has($relation, $operator, $count, 'or', $callback);
    }

    /**
     * Add a not has query to the query.
     *
     * @param string|array $relation The relation to check
     * @param string $boolean The boolean to use
     * @param Closure $callback The callback to use
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function not_has($relation, $boolean = 'and', ?Closure $callback = null)
    {
        return $this->has($relation, '<', 1, $boolean, $callback);
    }

    /**
     * Add an or not has query to the query.
     *
     * @param string|array $relation The relation to check
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function or_not_has($relation)
    {
        return $this->not_has($relation, 'or');
    }

    /**
     * Add a where not has query to the query.
     *
     * @param string|array $relation The relation to check
     * @param Closure $callback The callback to use
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function where_not_has($relation, ?Closure $callback = null)
    {
        return $this->not_has($relation, 'and', $callback);
    }

    /**
     * Add an or where not has query to the query.
     *
     * @param string|array $relation The relation to check
     * @param Closure $callback The callback to use
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function or_where_not_has($relation, ?Closure $callback = null)
    {
        return $this->not_has($relation, 'or', $callback);
    }

    /**
     * Add a where relation query to the query.
     *
     * @param string|array $relation The relation to check
     * @param Closure|string $column The column to check
     * @param string|null $operator The operator to use
     * @param mixed|null $value The value to check
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function where_relation($relation, $column, $operator = null, $value = null)
    {
        return $this->where_has($relation, function ($query) use ($column, $operator, $value) {
            if ($column instanceof Closure) {
                $column($query);
            } else {
                $query->where($column, $operator, $value);
            }
        });
    }

    /**
     * Add a where relation query to the query.
     *
     * @param string|array $relation The relation to check
     * @param Closure|string $column The column to check
     * @param string|null $operator The operator to use
     * @param mixed|null $value The value to check
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function with_where_relation($relation, $column, $operator = null, $value = null)
    {
        return $this->where_relation($relation, $column, $operator, $value)
            ->with([
                $relation => fn($query) => $column instanceof Closure
                    ? $column($query)
                    : $query->where($column, $operator, $value)
            ]);
    }

    /**
     * Add an or where relation query to the query.
     *
     * @param string|array $relation The relation to check
     * @param Closure|string $column The column to check
     * @param string|null $operator The operator to use
     * @param mixed|null $value The value to check
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function or_where_relation($relation, $column, $operator = null, $value = null)
    {
        return $this->or_where_has($relation, function ($query) use ($column, $operator, $value) {
            if ($column instanceof Closure) {
                $column($query);
            } else {
                $query->where($column, $operator, $value);
            }
        });
    }

    /**
     * Add a where not has relation query to the query.
     *
     * @param string|array $relation The relation to check
     * @param Closure|string $column The column to check
     * @param string|null $operator The operator to use
     * @param mixed|null $value The value to check
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function where_not_has_relation($relation, $column, $operator = null, $value = null)
    {
        return $this->where_not_has($relation, function ($query) use ($column, $operator, $value) {
            if ($column instanceof Closure) {
                $column($query);
            } else {
                $query->where($column, $operator, $value);
            }
        });
    }

    /**
     * Add an or where not has relation query to the query.
     *
     * @param string|array $relation The relation to check
     * @param Closure|string $column The column to check
     * @param string|null $operator The operator to use
     * @param mixed|null $value The value to check
     * 
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function or_where_not_has_relation($relation, $column, $operator = null, $value = null)
    {
        return $this->or_where_not_has($relation, function ($query) use ($column, $operator, $value) {
            if ($column instanceof Closure) {
                $column($query);
            } else {
                $query->where($column, $operator, $value);
            }
        });
    }

    /**
     * Add an aggregate query to the query.
     *
     * @param string|array $relations The relations to aggregate
     * @param mixed $column The column to aggregate
     * @param string $function The aggregate function
     * 
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    public function with_aggregate($relations, $column, $function = null)
    {
        if (empty($relations)) {
            return $this;
        }

        if ($this->columns === null) {
            $this->select([$this->from . '.*']);
        }

        $relations = Arr::wrap($relations);
        $relations = $this->parse_relations($relations);

        foreach ($relations as $name => $constraint_callbacks) {
            $relation = $this->get_relation_without_constraints($name);

            if ($function) {
                if ($this->get_compiler()->is_expression($column)) {
                    $aggregate_column = $this->get_compiler()->get_value($column);
                } else {
                    $aggregate_column = $this->get_compiler()->wrap($column);
                }

                $expression = $function === 'exists'
                    ? $aggregate_column
                    : sprintf('%s(%s)', $function, $aggregate_column);
            } else {
                $expression = $this->get_compiler()->get_value($column);
            }

            $query = $relation->get_relation_existence_query(
                $relation->get_related()->new_query(),
                $this,
                new Expression($expression)
            )->set_bindings([], 'select');

            $query = $query->merge_constraints_from($relation->get_query());

            if ($constraint_callbacks) {
                foreach ($constraint_callbacks as $callback) {
                    $query->call_scope($callback);
                }
            }

            $query->orders = null;
            $query->set_bindings([], 'order');

            $alias = collection([
                $name,
                $function ? $function : null,
                $column === '*' ? null : $this->get_compiler()->get_value($column),
            ])
                ->filter(fn($value) => $value !== null)
                ->join('_');

            if ($function === 'exists') {
                $this->select_raw(
                    sprintf('exists(%s) as %s', $query->to_sql(), $this->get_compiler()->wrap($alias)),
                    $query->get_bindings(),
                )->with_casts([$alias => 'boolean']);
            } else {
                if ($function === 'count') {
                    $this->with_casts([$alias => 'integer']);
                }

                $this->select_subquery($query, $alias);
            }
        }

        return $this;
    }

    /**
     * Get the relation without constraints.
     *
     * @param string $relation The relation name
     * 
     * @return Relation The relation instance
     * @since 1.0.0
     */
    protected function get_relation_without_constraints($relation)
    {
        return Relation::without_constraints(function () use ($relation) {
            return $this->get_model()->$relation();
        });
    }

    /**
     * Add a has where query to the query.
     *
     * @param string $relation The relation to check
     * @param string $operator The operator to use
     * @param int $count The count to use
     * @param string $boolean The boolean to use
     * @param Closure $callback The callback to use
     *
     * @return QueryBuilder The query builder instance for method chaining
     * @since 1.0.0
     */
    public function has($relation, $operator = '>=', $count = 1, $boolean = 'and', ?Closure $callback = null)
    {
        if (is_string($relation)) {
            $relation = $this->get_relation_without_constraints($relation);
        }

        $method = $this->is_existence_query($operator, $count)
            ? 'get_relation_existence_query'
            : 'get_relation_existence_count_query';

        $query = $relation->$method(
            $relation->get_related()->new_query(),
            $this
        );

        if ($callback) {
            $query->call_scope($callback);
        }

        return $this->add_has_where(
            $query,
            $relation,
            $operator,
            $count,
            $boolean
        );
    }

    /**
     * Add a has where query to the query.
     *
     * @param Relation $relation The relation to check
     * @param string $operator The operator to use
     * @param int $count The count to use
     * @param string $boolean The boolean to use
     *
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    protected function add_has_where(QueryBuilder $query, Relation $relation, $operator, $count, $boolean)
    {
        $query->merge_constraints_from($relation->get_query());

        return $this->is_existence_query($operator, $count)
            ? $this->add_where_exists_query($query, $boolean, $operator === '<' && $count === 1)
            : $this->add_where_count_query($query, $operator, $count, $boolean);
    }

    /**
     * Add a where count query to the query.
     *
     * @param QueryBuilder $query The query to add the where count query to
     * @param string $operator The operator to use
     * @param int $count The count to use
     * @param string $boolean The boolean to use
     *
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    protected function add_where_count_query(QueryBuilder $query, $operator = '>=', $count = 1, $boolean = 'and')
    {
        $this->add_bindings($query->get_bindings(), 'where');

        return $this->where(
            new Expression(sprintf('(%s)', $query->to_sql())),
            $operator,
            is_numeric($count) ? new Expression($count) : $count,
            $boolean
        );
    }

    /**
     * Merge constraints from another query builder.
     *
     * @param QueryBuilder $from The query builder to merge from
     *
     * @return $this The query builder instance for method chaining
     * @since 1.0.0
     */
    public function merge_constraints_from(QueryBuilder $from)
    {
        $where_bindings = $from->get_binding('where') ?? [];

        $wheres = $from->from !== $this->from
            ? $this->re_qualify_where_tables(
                $from->wheres,
                $from->get_compiler()->get_value($from->from),
                $this->get_model()->get_table(),
            ) : $from->wheres;

        return $this->merge_wheres($wheres, $where_bindings);
    }

    /**
     * Re-qualify where tables.
     *
     * @param array $wheres The wheres to re-qualify
     * @param string $from The from table
     * @param string $to The to table
     *
     * @return array The re-qualified wheres
     * @since 1.0.0
     */
    protected function re_qualify_where_tables(array $wheres, string $from, string $to)
    {
        return collection($wheres)->map(function ($where) use ($from, $to) {
            return collection($where)->map(function ($value) use ($from, $to) {
                return is_string($value) && str_starts_with($value, $from . '.')
                    ? $to . '.' . Str::after_last($value, '.')
                    : $value;
            });
        })->to_array();
    }

    /**
     * Check if the query is an existence query.
     *
     * @param string $operator The operator to use
     * @param int $count The count to use
     *
     * @return bool Whether the query is an existence query
     * @since 1.0.0
     */
    protected function is_existence_query($operator, $count)
    {
        return ($operator === '>=' || $operator === '<') && $count === 1;
    }
}
