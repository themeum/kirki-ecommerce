<?php

namespace Kirki\Ecommerce\Database\Query\Relations;

use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

/**
 * Define a one-to-one relation between parent and related models.
 *
 * Constrains the related query to match a single record whose foreign key
 * points to the parent's local key. Supports lazy and eager loading and
 * matching results back to parent models.
 *
 * @since 1.0.0
 */
class HasOne extends Relation
{
    /**
     * The foreign key on the related model that references the parent model.
     *
     * @var string
     */
    protected $foreign_key;

    /**
     * The local key on the parent model that is referenced by the related model.
     *
     * @var string
     */
    protected $local_key;

    /**
     * Create a new has-one relation instance.
     *
     * Stores key names and applies base constraints for the relation so that
     * subsequent queries target only the appropriate related record.
     *
     * @param Model $related The related model instance
     * @param Model $parent The parent model instance
     * @param mixed $foreign_key The related table's foreign key
     * @param mixed $local_key The parent's local key
     * @return void No return value
     * @since 1.0.0
     */
    public function __construct(Model $related, Model $parent, $foreign_key, $local_key)
    {
        $this->foreign_key = $foreign_key;
        $this->local_key = $local_key;

        parent::__construct($related, $parent);
    }

    /**
     * Apply base constraints using the parent's local key.
     *
     * When the parent has a local key value, the query is limited to rows
     * whose foreign key matches that value to ensure only the related record
     * is retrieved.
     *
     * @return void No return value
     * @since 1.0.0
     */
    public function add_constraints()
    {
        if (static::$constraints) {
            $value = $this->parent->get_attribute($this->local_key);

            $this->query->where($this->foreign_key, '=', $value);
            $this->query->where_not_null($this->foreign_key);
        }
    }

    /**
     * Get the aggregate query for the relation.
     *
     * @param QueryBuilder $query The query builder instance
     * @param QueryBuilder $parent The parent query builder instance
     * @param array $columns The columns to select
     * @return QueryBuilder The aggregate query builder
     * @since 1.0.0
     */
    public function get_relation_existence_query(QueryBuilder $query, QueryBuilder $parent, $columns = ['*'])
    {
        if ($query->from === $parent->from) {
            return $this->get_relation_existence_query_for_self_relation($query, $parent, $columns);
        }

        return parent::get_relation_existence_query($query, $parent, $columns);
    }

    /**
     * Get the aggregate query for the relation.
     *
     * @param QueryBuilder $query The query builder instance
     * @param QueryBuilder $parent The parent query builder instance
     * @param array $columns The columns to select
     * @return QueryBuilder The aggregate query builder
     * @since 1.0.0
     */
    public function get_relation_existence_query_for_self_relation(QueryBuilder $query, QueryBuilder $parent, $columns = ['*'])
    {
        $query->from($query->get_model()->get_table() . ' as ' . $hash = $this->get_relation_count_hash());

        $query->get_model()->set_table($hash);

        return $query->select($columns)->where_column(
            $this->get_qualified_parent_key_name(),
            '=',
            $hash . '.' . $this->get_foreign_key_name()
        );
    }

    /**
     * Get the existence compare key for the relation.
     *
     * @return string The existence compare key
     * @since 1.0.0
     */
    public function get_existence_compare_key()
    {
        return $this->qualify_column($this->foreign_key);
    }

    /**
     * Get the qualified parent key name.
     *
     * @return string The qualified parent key name
     * @since 1.0.0
     */
    public function get_qualified_parent_key_name()
    {
        return $this->parent->prepare_column($this->local_key);
    }

    /**
     * Get the foreign key name.
     *
     * @return string The foreign key name
     * @since 1.0.0
     */
    public function get_foreign_key_name()
    {
        $segments = explode('.', $this->get_qualified_parent_key_name());

        return end($segments);
    }

    /**
     * Get the single related model for lazy loading.
     *
     * Returns the first result from the constrained query which should
     * correspond to the one related record for the parent.
     *
     * @return mixed The related model instance or null if not found
     * @since 1.0.0
     */
    public function get_results()
    {
        return $this->first();
    }

    /**
     * Add eager loading constraints across multiple parents.
     *
     * Collects parent local keys and scopes the query using a where_in to fetch
     * all related records in a single query.
     *
     * @param array $models The array of parent models
     * @return void No return value
     * @since 1.0.0
     */
    public function add_eager_constraints(array $models)
    {
        $keys = [];
        foreach ($models as $model) {
            $key = $model->get_attribute($this->local_key);
            if ($key !== null) {
                $keys[] = $key;
            }
        }

        if (!empty($keys)) {
            $this->query->where_in($this->foreign_key, array_unique($keys));
        }
    }

    /**
     * Match eager loaded results back to their parents.
     *
     * Builds a dictionary keyed by the foreign key so that each parent can be
     * assigned its corresponding related model instance.
     *
     * @param array $models The parent models to receive results
     * @param mixed $results The related results to match
     * @param string $relation The relation name on the parent
     * @return array The array of parent models with relations set
     * @since 1.0.0
     */
    public function match(array $models, $results, $relation)
    {
        $dictionary = [];

        foreach ($results as $result) {
            $key = $result->get_attribute($this->foreign_key);
            $dictionary[$key] = $result;
        }

        foreach ($models as $model) {
            $key = $model->get_attribute($this->local_key);
            if (isset($dictionary[$key])) {
                $model->relations[$relation] = $dictionary[$key];
            }
        }

        return $models;
    }

    /**
     * Get the local key for the relation.
     *
     * Returns the key on the parent model that is used to match related records.
     *
     * @return string The local key name
     * @since 1.0.0
     */
    public function get_local_key()
    {
        return $this->local_key;
    }
}
