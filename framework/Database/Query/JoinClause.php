<?php

namespace Kirki\Ecommerce\Database\Query;

use Closure;

/**
 * Represents a JOIN clause sub-builder for building join conditions fluently.
 *
 * This class extends the QueryBuilder and is used internally for building complex
 * JOIN ON conditions, including nested and dynamic join clauses, for SQL queries.
 *
 * @since 1.0.0
 */
class JoinClause extends QueryBuilder
{
    /**
     * The type of join (e.g., INNER, LEFT, RIGHT).
     *
     * @var string
     */
    public $type;

    /**
     * The table to be joined.
     *
     * @var string
     */
    public $table;

    /**
     * The parent QueryBuilder instance.
     *
     * @var \Ecommerce\Database\Query\QueryBuilder
     */
    public $parent;

    /**
     * The query compiler from the parent builder.
     *
     * @var \Ecommerce\Database\Query\QueryCompiler
     */
    protected $parent_compiler;

    /**
     * The database connection from the parent builder.
     *
     * @var \Ecommerce\Database\Connection\Connection
     */
    protected $parent_connection;

    /**
     * Create a new JoinClause instance.
     *
     * @param QueryBuilder $parent The parent query builder instance.
     * @param string $type The join type (INNER, LEFT, etc.).
     * @param string $table The table being joined.
     *
     * @since 1.0.0
     */
    public function __construct(QueryBuilder $parent, $type, $table)
    {
        $this->type = $type;
        $this->table = $table;
        $this->parent = $parent;
        $this->parent_compiler = $parent->get_compiler();
        $this->parent_connection = $parent->get_connection();

        parent::__construct($this->parent_connection, $this->parent_compiler, $this->parent->model);
    }

    /**
     * Add an ON condition to the join.
     *
     * Accepts either simple column comparison or a closure for nested join conditions.
     *
     * @param string|\Closure $first The first column (or a closure for nesting).
     * @param string|null $operator The comparison operator (=, >, etc.).
     * @param string|null $second The second column for the ON condition.
     * @param string $boolean The boolean operator (AND/OR) for the condition.
     * 
     * @return JoinClause
     * 
     * @since 1.0.0
     */
    public function on($first, $operator = null, $second = null, $boolean = 'and')
    {
        if ($first instanceof Closure) {
            return $this->where_nested($first, $boolean);
        }

        return $this->where_column($first, $operator, $second, $boolean);
    }

    /**
     * Add an OR ON condition to the join.
     *
     * @param string|\Closure $first The first column or closure.
     * @param string|null $operator The operator (optional).
     * @param string|null $second The second column (optional).
     * @return JoinClause
     * @since 1.0.0
     */
    public function or_on($first, $operator = null, $second = null)
    {
        return $this->on($first, $operator, $second, 'or');
    }

    /**
     * Create a new JoinClause instance for building nested join conditions.
     *
     * @return static
     * @since 1.0.0
     */
    public function new_query()
    {
        return new static($this->new_parent_query(), $this->type, $this->table);
    }

    /**
     * Create a new parent QueryBuilder instance.
     *
     * Used to generate a fresh parent builder for subqueries or nested clauses.
     *
     * @return QueryBuilder
     * @since 1.0.0
     */
    protected function new_parent_query()
    {
        $class = get_class($this->parent);

        return new $class(
            $this->parent_connection,
            $this->parent_compiler,
            $this->parent->model
        );
    }

    /**
     * Create a new parent query instance for subqueries within join clauses.
     *
     * @return QueryBuilder
     * @since 1.0.0
     */
    protected function for_subquery()
    {
        return $this->new_parent_query()->new_query();
    }
}
