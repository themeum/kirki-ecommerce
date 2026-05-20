<?php

namespace Kirki\Ecommerce\Database\Query\Relations;

use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

/**
 * Define an inverse relation where the parent belongs to another model.
 *
 * Constrains the related query to the owner record referenced by the parent's
 * foreign key. Supports lazy and eager loading and provides helpers to
 * associate or dissociate the owner.
 *
 * @since 1.0.0
 */
class BelongsTo extends Relation
{
    /**
     * The foreign key on the parent model that references the owner model.
     *
     * @var string
     */
    protected $foreign_key;

    /**
     * The primary key or unique key on the related (owner) model being referenced.
     *
     * @var string
     */
    protected $owner_key;

    /**
     * The child model instance.
     *
     * @var Model
     */
    protected $child;

    /**
     * Create a new belongs-to relation instance.
     *
     * Stores the foreign and owner key names and applies constraints so the
     * query targets the owning record for the current parent model.
     *
     * @param Model $related The related (owner) model instance
     * @param Model $child The parent model instance
     * @param mixed $foreign_key The foreign key on the parent model
     * @param mixed $owner_key The key on the related model being referenced
     * @return void No return value
     * @since 1.0.0
     */
    public function __construct(Model $related, Model $child, $foreign_key, $owner_key)
    {
        $this->foreign_key = $foreign_key;
        $this->owner_key = $owner_key;

        $this->child = $child;

        parent::__construct($related, $child);
    }

    /**
     * Apply base constraints to match the parent's foreign key.
     *
     * When the parent has a foreign key value, the query is scoped so that the
     * owner's key equals that value, ensuring only the referenced owner is
     * returned.
     *
     * @return void No return value
     * @since 1.0.0
     */
    public function add_constraints()
    {
        if (static::$constraints) {
            $key = $this->owner_key;
            $value = $this->child->get_attribute($this->foreign_key);

            $this->query->where($key, '=', $value);
        }
    }

    /**
     * Get the aggregate query for the relation.
     *
     * @param QueryBuilder $query The query builder instance
     * @param QueryBuilder $parent The parent query builder instance
     * @param mixed $columns The columns to select
     * @return QueryBuilder The aggregate query
     * @since 1.0.0
     */
    public function get_relation_existence_query(QueryBuilder $query, QueryBuilder $parent, $columns = ['*'])
    {
        if ($parent->from === $query->from) {
            return $this->get_relation_existence_query_for_self_relation($query, $parent, $columns);
        }

        return $query->select($columns)->where_column(
            $this->get_qualified_foreign_key_name(),
            '=',
            $query->qualify_column($this->owner_key)
        );
    }

    /**
     * Get the aggregate query for the relation for self join.
     *
     * @param QueryBuilder $query The query builder instance
     * @param QueryBuilder $parent The parent query builder instance
     * @param mixed $columns The columns to select
     * @return QueryBuilder The aggregate query
     * @since 1.0.0
     */
    public function get_relation_existence_query_for_self_relation(QueryBuilder $query, QueryBuilder $parent, $columns = ['*'])
    {
        $query->select($columns)->from(
            $query->get_model()->get_table() . ' as ' . ($hash = $this->get_relation_count_hash())
        );

        $query->get_model()->set_table($hash);

        return $query->where_column(
            $hash . '.' . $this->owner_key,
            '=',
            $this->get_qualified_foreign_key_name()
        );
    }

    /**
     * Get the qualified foreign key name.
     *
     * @return string The qualified foreign key name
     * @since 1.0.0
     */
    public function get_qualified_foreign_key_name()
    {
        return $this->child->prepare_column($this->foreign_key);
    }

    /**
     * Get the related owner model for lazy loading.
     *
     * Returns the first (and only) result from the constrained query.
     *
     * @return mixed The owner model instance or null if not found
     * @since 1.0.0
     */
    public function get_results()
    {
        return $this->first(['*']);
    }

    /**
     * Add eager constraints across multiple parent models.
     *
     * Collects foreign key values from parents and scopes the query using a
     * where_in on the owner's key to fetch all owners in one query.
     *
     * @param array $models The parent models to derive keys from
     * @return void No return value
     * @since 1.0.0
     */
    public function add_eager_constraints(array $models)
    {
        $keys = [];
        foreach ($models as $model) {
            $key = $model->get_attribute($this->foreign_key);
            if ($key !== null) {
                $keys[] = $key;
            }
        }

        if (!empty($keys)) {
            $this->query->where_in($this->owner_key, array_unique($keys));
        }
    }

    /**
     * Match eager loaded owners back to their parents.
     *
     * Builds a dictionary by owner key and assigns the corresponding owner
     * model to each parent under the relation name.
     *
     * @param array $models The parent models receiving owners
     * @param mixed $results The owner results fetched by the query
     * @param string $relation The relation name on the parent
     * @return array The parent models with owners assigned
     * @since 1.0.0
     */
    public function match(array $models, $results, $relation)
    {
        $dictionary = [];

        foreach ($results as $result) {
            $key = $result->get_attribute($this->owner_key);
            $dictionary[$key] = $result;
        }

        foreach ($models as $model) {
            $key = $model->get_attribute($this->foreign_key);
            if (isset($dictionary[$key])) {
                $model->relations[$relation] = $dictionary[$key];
            }
        }

        return $models;
    }

    /**
     * Associate the parent with the given owner model.
     *
     * Sets the parent's foreign key to the owner's key value and updates the
     * in-memory relation reference for immediate access and serialization.
     *
     * @param Model $model The owner model to associate
     * @return Model The parent model for method chaining
     *
     * @since 1.0.0
     */
    public function associate(Model $model)
    {
        $this->child->set_attribute(
            $this->foreign_key,
            $model->get_attribute($this->owner_key)
        );

        $this->child->relations[$this->foreign_key] = $model;

        return $this->child;
    }

    /**
     * Dissociate the parent from its current owner.
     *
     * Nulls the parent's foreign key and removes the in-memory relation entry
     * so that subsequent access reflects the dissociation.
     *
     * @return Model The parent model for method chaining
     * @since 1.0.0
     */
    public function dissociate()
    {
        $this->child->set_attribute($this->foreign_key, null);

        unset($this->child->relations[$this->foreign_key]);

        return $this->child;
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
        return $this->owner_key;
    }
}
