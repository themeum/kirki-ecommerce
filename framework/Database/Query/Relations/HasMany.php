<?php

namespace Kirki\Ecommerce\Database\Query\Relations;

use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

use function Kirki\Ecommerce\collection;

/**
 * Define a one-to-many relation between parent and related models.
 *
 * Constrains the related query to records whose foreign key points to the
 * parent's local key. Supports lazy loading, eager loading with where-in, and
 * matching results back to parents as collections.
 *
 * @since 1.0.0
 */
class HasMany extends Relation
{
    /**
     * The foreign key on the related model that references the parent model.
     *
     * @var string
     */
    protected $foreign_key;

    /**
     * The local key on the parent model that is referenced by the foreign key.
     *
     * @var string
     */
    protected $local_key;

    /**
     * Create a new has-many relation instance.
     *
     * Stores keys and applies base constraints so that subsequent queries
     * return only the child records belonging to the given parent.
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
     * whose foreign key equals that value to ensure only belonging children are
     * retrieved.
     *
     * @return void No return value
     * @since 1.0.0
     */
    public function add_constraints()
    {
        if (static::$constraints) {
            $key = $this->foreign_key;
            $value = $this->parent->get_attribute($this->local_key);

            $this->query->where($key, '=', $value);
        }
    }

    /**
     * Get the aggregate query for the relation.
     *
     * @param QueryBuilder $query The query builder instance
     * @param QueryBuilder $parent The parent query builder instance
     * @param mixed $columns The columns to select
     * 
     * @return QueryBuilder The aggregate query
     * 
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
     * Get the aggregate query for the relation when the query and parent are the same.
     *
     * @param QueryBuilder $query The query builder instance
     * @param QueryBuilder $parent The parent query builder instance
     * @param mixed $columns The columns to select
     * 
     * @return QueryBuilder The aggregate query
     * 
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
        $segments = explode('.', $this->get_qualified_foreign_key_name());

        return end($segments);
    }

    /**
     * Get the qualified foreign key name.
     *
     * @return string The qualified foreign key name
     * @since 1.0.0
     */
    public function get_qualified_foreign_key_name()
    {
        return $this->foreign_key;
    }

    /**
     * Get the related results for lazy loading.
     *
     * Returns a collection of child models matching the applied constraints.
     *
     * @return Collection The collection of related models
     * @since 1.0.0
     */
    public function get_results()
    {
        return $this->get();
    }

    /**
     * Add eager loading constraints across multiple parents.
     *
     * Collects parent local keys and scopes the query using where_in to fetch
     * all required children in a single query.
     *
     * @param array $models The parent models
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
     * Groups children by their foreign key and assigns a collection to each
     * parent under the relation name, defaulting to an empty collection when
     * none are present.
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
            if (!isset($dictionary[$key])) {
                $dictionary[$key] = [];
            }
            $dictionary[$key][] = $result;
        }

        foreach ($models as $model) {
            $key = $model->get_attribute($this->local_key);
            if (isset($dictionary[$key])) {
                $model->relations[$relation] = collection($dictionary[$key]);
            } else {
                $model->relations[$relation] = collection();
            }
        }

        return $models;
    }

    /**
     * Create a new related model with the foreign key pre-filled.
     *
     * Assigns the parent's local key to the child's foreign key attribute and
     * delegates to the related model's create method to persist the record.
     *
     * @param array $attributes The attributes for the new child model
     * @return Model The created related model instance
     * @since 1.0.0
     */
    public function create(array $attributes)
    {
        $model = $this->related->new_instance(
            $this->set_foreign_attributes_for_create($attributes)
        );

        $model->save();

        return $model;
    }

    /**
     * Set the foreign key attribute for the given attributes array.
     *
     * @param array $attributes The attributes array to modify
     * @return array The modified attributes array
     * @since 1.0.0
     */
    protected function set_foreign_attributes_for_create(array $attributes)
    {
        $attributes[$this->foreign_key] = $this->parent->get_attribute($this->local_key);

        return $attributes;
    }

    /**
     * Create multiple related models with the foreign key pre-filled.
     *
     * Iterates over the given attributes array, creating a new related model
     * for each set of attributes and adding it to the models array.
     *
     * @param array $attributes The attributes for the new child models
     * @return array<Model> The array of created related models
     * @since 1.0.0
     */
    public function create_many(array $attributes)
    {
        if (!is_array(reset($attributes))) {
            $attributes = [$attributes];
        }

        $models = [];

        foreach ($attributes as $attribute) {
            $models[] = $this->create($attribute);
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
