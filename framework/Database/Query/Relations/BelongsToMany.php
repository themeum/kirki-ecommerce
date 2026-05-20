<?php

namespace Kirki\Ecommerce\Database\Query\Relations;

use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

use function Kirki\Ecommerce\collection;

/**
 * Define a many-to-many relation using a pivot table.
 *
 * Joins the related table through a pivot, adding constraints and selections
 * for pivot keys and optional pivot columns. Supports eager loading, matching
 * results, and managing pivot records via attach, detach, sync, and toggle.
 *
 * @since 1.0.0
 */
class BelongsToMany extends Relation
{
    /**
     * The name of the pivot table used for the many-to-many relationship.
     * This table holds the associations between the parent and related models.
     *
     * @var string
     */
    protected $pivot_table;

    /**
     * The foreign key column name on the pivot table referencing the parent model.
     * This column stores the identifier of the parent model in the pivot table.
     *
     * @var string
     */
    protected $foreign_pivot_key;

    /**
     * The foreign key column name on the pivot table referencing the related model.
     * This column stores the identifier of the related model in the pivot table.
     *
     * @var string
     */
    protected $related_pivot_key;

    /**
     * The primary key name on the parent model.
     * This is the key used to identify the parent model in its own table.
     *
     * @var string
     */
    protected $parent_key;

    /**
     * The primary key name on the related model.
     * This is the key used to identify the related model in its own table.
     *
     * @var string
     */
    protected $related_key;

    /**
     * The additional columns to be selected from the pivot table.
     * These columns allow retrieval of extra data stored in the pivot table.
     *
     * @var array
     */
    protected $pivot_columns = [];

    /**
     * The additional where conditions to be applied on the pivot table.
     * These conditions filter the pivot table records when querying the relationship.
     *
     * @var array
     */
    protected $pivot_wheres = [];

    /**
     * The additional where in conditions to be applied on the pivot table.
     * These conditions filter the pivot table records when querying the relationship.
     *
     * @var array
     */
    protected $pivot_where_ins = [];

    /**
     * The additional where null conditions to be applied on the pivot table.
     * These conditions filter the pivot table records when querying the relationship.
     *
     * @var array
     */
    protected $pivot_where_nulls = [];

    /**
     * Create a new belongs-to-many relation instance.
     *
     * Stores pivot and key names, applies default join and base constraints so
     * that the relation query returns related models with pivot context.
     *
     * @param Model $related The related model instance
     * @param Model $parent The parent model instance
     * @param mixed $pivot_table The pivot table name
     * @param mixed $foreign_pivot_key The pivot column for the parent key
     * @param mixed $related_pivot_key The pivot column for the related key
     * @param mixed $parent_key The local key name on the parent model
     * @param mixed $related_key The key name on the related model
     * @return void No return value
     * @since 1.0.0
     */
    public function __construct(
        Model $related,
        Model $parent,
        $pivot_table,
        $foreign_pivot_key,
        $related_pivot_key,
        $parent_key,
        $related_key
    ) {
        $this->pivot_table = $pivot_table;
        $this->foreign_pivot_key = $foreign_pivot_key;
        $this->related_pivot_key = $related_pivot_key;
        $this->parent_key = $parent_key;
        $this->related_key = $related_key;

        parent::__construct($related, $parent);
    }

    /**
     * Apply base constraints and join through the pivot table.
     *
     * Ensures the relation query joins the pivot and filters using the
     * parent's key when available so only related records are returned.
     *
     * @return void No return value
     * @since 1.0.0
     */
    public function add_constraints()
    {
        if (static::$constraints) {
            $this->perform_join();

            $key = "{$this->pivot_table}.{$this->foreign_pivot_key}";
            $value = $this->parent->get_attribute($this->parent_key);

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
            return $this->get_relation_existence_query_for_self_join($query, $parent, $columns);
        }

        $this->perform_join($query);

        return parent::get_relation_existence_query($query, $parent, $columns);
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
    public function get_relation_existence_query_for_self_join(QueryBuilder $query, QueryBuilder $parent, $columns = ['*'])
    {
        $query->select($columns);
        $query->from($this->related->get_table() . ' as ' . $hash = $this->get_relation_count_hash());
        $this->related->set_table($hash);

        $this->perform_join($query);

        return parent::get_relation_existence_query($query, $parent, $columns);
    }

    /**
     * Get the existence compare key for the relation.
     *
     * @return string The existence compare key
     * @since 1.0.0
     */
    public function get_existence_compare_key()
    {
        return $this->qualify_pivot_column($this->foreign_pivot_key);
    }

    /**
     * Configure the join and default select columns for the relation.
     *
     * Selects all related columns along with the foreign pivot key aliased for
     * matching. Establishes the join between related and pivot tables.
     *
     * @return void No return value
     * @since 1.0.0
     */
    protected function perform_join($query = null)
    {
        $query = $query ?: $this->query;

        $related_table = $this->related->get_table();
        $related_columns = $this->related_columns();

        $query->select([
            ...$related_columns,
            ...$this->qualify_pivot_columns()
        ]);

        $query->join(
            $this->pivot_table,
            "{$related_table}.{$this->related_key}",
            '=',
            "{$this->pivot_table}.{$this->related_pivot_key}"
        );
    }

    /**
     * Get the related columns for the query.
     *
     * @return array The related columns
     * @since 1.0.0
     */
    protected function related_columns()
    {
        return collection($this->query->columns ? $this->query->columns : ['*'])
            ->map(fn($column) => $this->prepare_related_column($column))
            ->all();
    }

    protected function prepare_related_column($column)
    {
        if ($this->query->get_compiler()->is_expression($column)) {
            return $column;
        }

        $related_table = $this->related->get_table();

        return str_contains($column, '.')
            ? $column
            : $related_table . '.' . $column;
    }

    /**
     * Prepare pivot columns for the query.
     *
     * @return array The prepared pivot columns
     * @since 1.0.0
     */
    protected function qualify_pivot_columns()
    {
        return collection(array_filter([
            $this->foreign_pivot_key,
            $this->related_pivot_key,
            ...$this->pivot_columns
        ], fn($column) => $column !== null))
            ->map(fn($column) => $this->qualify_pivot_column($column) . ' as pivot_' . $column)
            ->all();
    }

    /**
     * Get the related results for lazy loading.
     *
     * Returns a collection of related models, including any selected pivot
     * columns as aliases prefixed with pivot_.
     *
     * @return Collection The collection of related models
     * @since 1.0.0
     */
    public function get_results()
    {
        return $this->get();
    }

    /**
     * Add eager loading constraints across the given parents.
     *
     * Scopes the query by collecting parent keys and applying a where_in on the
     * foreign pivot key so all related models can be fetched at once.
     *
     * @param array $models The parent models to constrain by
     * @return void No return value
     * @since 1.0.0
     */
    public function add_eager_constraints(array $models)
    {
        $keys = [];
        foreach ($models as $model) {
            $key = $model->get_attribute($this->parent_key);
            if ($key !== null) {
                $keys[] = $key;
            }
        }

        if (!empty($keys)) {
            $this->perform_join();
            $this->query->where_in(
                "{$this->pivot_table}.{$this->foreign_pivot_key}",
                array_unique($keys)
            );
        }
    }

    /**
     * Match eager loaded related models back to their parents.
     *
     * Builds a dictionary keyed by the foreign pivot key and assigns a
     * collection to each parent under the relation name, defaulting to an
     * empty collection when none exist.
     *
     * @param array $models The parent models receiving results
     * @param mixed $results The related results including pivot aliases
     * @param string $relation The relation name on the parent
     * @return array The parent models with relations populated
     * @since 1.0.0
     */
    public function match(array $models, $results, $relation)
    {
        $dictionary = [];

        foreach ($results as $result) {
            $pivot_key_name = "pivot_{$this->foreign_pivot_key}";
            $key = $result->get_attribute($pivot_key_name);
            if ($key === null) {
                $key = $result->get_attribute($this->foreign_pivot_key);
            }
            if (!isset($dictionary[$key])) {
                $dictionary[$key] = [];
            }
            $dictionary[$key][] = $this->migrate_pivot_attributes($result);
        }

        foreach ($models as $model) {
            $key = $model->get_attribute($this->parent_key);
            if (isset($dictionary[$key])) {
                $model->relations[$relation] = collection($dictionary[$key]);
            } else {
                $model->relations[$relation] = collection();
            }
        }

        return $models;
    }

    /**
     * Migrate pivot attributes to the model.
     *
     * @param Model $model The model to migrate the pivot attributes to
     * @return Model The model with the migrated pivot attributes
     * @since 1.0.0
     */
    protected function migrate_pivot_attributes(Model $model): Model
    {
        $values = [];

        foreach ($model->get_attributes() as $key => $value) {
            if (str_starts_with($key, 'pivot_')) {
                $values[substr($key, 6)] = $value;
                unset($model->$key);
            }
        }

        $model->set_attribute('pivot', $values);

        return $model;
    }

    /**
     * Include additional pivot columns in the select.
     *
     * Accepts a single column, array, or variadic list and adds aliased
     * selections for each as pivot_<name> to the relation query.
     *
     * @param mixed $columns The pivot column name(s) to include
     * @return $this The relation instance for method chaining
     * @since 1.0.0
     */
    public function with_pivot($columns)
    {
        $this->pivot_columns = array_merge(
            $this->pivot_columns,
            is_array($columns) ? $columns : func_get_args()
        );

        return $this;
    }

    /**
     * Add a where clause scoped to the pivot table.
     *
     * Prefixes the provided column with the pivot table and forwards the
     * condition to the underlying query builder for filtering.
     *
     * @param string $column The pivot column to filter
     * @param mixed $operator The comparison operator or value when two args
     * @param mixed $value The value to compare against when operator provided
     * @return $this The relation instance for method chaining
     * @since 1.0.0
     */
    public function where_pivot($column, $operator = null, $value = null, $boolean = 'and')
    {
        $this->pivot_wheres[] = func_get_args();

        $this->where(
            $this->qualify_pivot_column($column),
            $operator,
            $value,
            $boolean
        );

        return $this;
    }

    /**
     * Add a "where" clause on the pivot table with "or" boolean.
     *
     * @param string $column
     * @param mixed $operator
     * @param mixed $value
     * @return $this
     * @since 1.0.0
     */
    public function or_where_pivot($column, $operator = null, $value = null)
    {
        return $this->where_pivot($column, $operator, $value, 'or');
    }

    /**
     * Add a "where between" clause on the pivot table.
     *
     * @param string $column
     * @param array $values
     * @param string $boolean
     * @param bool $not
     * @return $this
     * @since 1.0.0
     */
    public function where_pivot_between($column, array $values, $boolean = 'and', $not = false)
    {
        return $this->where_between($this->qualify_pivot_column($column), $values, $boolean, $not);
    }

    /**
     * Add an "or where between" clause on the pivot table.
     *
     * @param string $column
     * @param array $values
     * @return $this
     * @since 1.0.0
     */
    public function or_where_pivot_between($column, array $values)
    {
        return $this->where_pivot_between($column, $values, 'or');
    }

    /**
     * Add a "where not between" clause on the pivot table.
     *
     * @param string $column
     * @param array $values
     * @param string $boolean
     * @return $this
     * @since 1.0.0
     */
    public function where_pivot_not_between($column, array $values, $boolean = 'and')
    {
        return $this->where_pivot_between($column, $values, $boolean, true);
    }

    /**
     * Add an "or where not between" clause on the pivot table.
     *
     * @param string $column
     * @param array $values
     * @return $this
     * @since 1.0.0
     */
    public function or_where_pivot_not_between($column, array $values)
    {
        return $this->where_pivot_not_between($column, $values, 'or');
    }

    /**
     * Add a "where in" clause on the pivot table.
     *
     * @param string $column
     * @param array|\Closure $values
     * @param string $boolean
     * @param bool $not
     * @return $this
     * @since 1.0.0
     */
    public function where_pivot_in($column, $values, $boolean = 'and', $not = false)
    {
        $this->pivot_where_ins[] = func_get_args();

        return $this->where_in($this->qualify_pivot_column($column), $values, $boolean, $not);
    }

    /**
     * Add an "or where in" clause on the pivot table.
     *
     * @param string $column
     * @param array|\Closure $values
     * @return $this
     * @since 1.0.0
     */
    public function or_where_pivot_in($column, $values)
    {
        return $this->where_pivot_in($column, $values, 'or');
    }

    /**
     * Add a "where not in" clause on the pivot table.
     *
     * @param string $column
     * @param array|\Closure $values
     * @param string $boolean
     * @return $this
     * @since 1.0.0
     */
    public function where_pivot_not_in($column, $values, $boolean = 'and')
    {
        return $this->where_pivot_in($column, $values, $boolean, true);
    }

    /**
     * Add an "or where not in" clause on the pivot table.
     *
     * @param string $column
     * @param array|\Closure $values
     * @return $this
     * @since 1.0.0
     */
    public function or_where_pivot_not_in($column, $values)
    {
        return $this->where_pivot_not_in($column, $values, 'or');
    }

    /**
     * Add a "where null" clause on the pivot table.
     *
     * @param string $column
     * @param string $boolean
     * @param bool $not
     * @return $this
     * @since 1.0.0
     */
    public function where_pivot_null($column, $boolean = 'and', $not = false)
    {
        $this->pivot_where_nulls[] = func_get_args();

        return $this->where_null($this->qualify_pivot_column($column), $boolean, $not);
    }

    /**
     * Add an "or where null" clause on the pivot table.
     *
     * @param string $column
     * @return $this
     * @since 1.0.0
     */
    public function or_where_pivot_null($column)
    {
        return $this->where_pivot_null($column, 'or');
    }

    /**
     * Add a "where not null" clause on the pivot table.
     *
     * @param string $column
     * @param string $boolean
     * @return $this
     * @since 1.0.0
     */
    public function where_pivot_not_null($column, $boolean = 'and')
    {
        return $this->where_pivot_null($column, $boolean, true);
    }

    /**
     * Add an "or where not null" clause on the pivot table.
     *
     * @param string $column
     * @return $this
     * @since 1.0.0
     */
    public function or_where_pivot_not_null($column)
    {
        return $this->where_pivot_not_null($column, 'or');
    }

    /**
     * Add an "order by" clause on the pivot table.
     *
     * @param string $column
     * @param string $direction
     * @return $this
     * @since 1.0.0
     */
    public function order_by_pivot($column, $direction = 'asc')
    {
        return $this->order_by($this->qualify_pivot_column($column), $direction);
    }

    /**
     * Prepare the pivot column for the query.
     *
     * @param mixed $column The pivot column to prepare
     * @return string The prepared pivot column
     * @since 1.0.0
     */
    protected function qualify_pivot_column($column)
    {
        if ($this->query->get_compiler()->is_expression($column)) {
            return $column;
        }

        if ($column === null) {
            return null;
        }

        return str_contains($column, '.')
            ? $column
            : $this->pivot_table . '.' . $column;
    }

    /**
     * Attach related records to the parent via the pivot table.
     *
     * Accepts a single id or an array/map of ids to attributes and inserts the
     * appropriate pivot records, automatically adding timestamps when enabled.
     *
     * @param mixed $id The related model id or array map of ids to attributes
     * @param array $attributes Additional pivot attributes to store
     * @return void No return value
     * @since 1.0.0
     */
    public function attach($id, array $attributes = [])
    {
        if (is_array($id)) {
            foreach ($id as $single_id => $attrs) {
                if (is_numeric($single_id)) {
                    $this->attach($attrs);
                } else {
                    $this->attach($single_id, $attrs);
                }
            }
            return;
        }

        $record = array_merge([
            $this->foreign_pivot_key => $this->parent->get_attribute($this->parent_key),
            $this->related_pivot_key => $id,
        ], $attributes);

        $this->add_timestamps_to_pivot($record);

        $query = $this->parent::query();
        $query->from($this->pivot_table)->insert($record);
    }

    /**
     * Detach related records from the parent via the pivot table.
     *
     * Deletes pivot rows matching the parent's key and optionally limited to
     * the given related ids when provided.
     *
     * @param mixed $ids Optional id or array of ids to detach
     * @return int The number of pivot rows deleted
     * @since 1.0.0
     */
    public function detach($ids = null)
    {
        $query = $this->parent::query()->from($this->pivot_table);

        $query->where(
            $this->foreign_pivot_key,
            '=',
            $this->parent->get_attribute($this->parent_key)
        );

        if ($ids !== null) {
            $ids = is_array($ids) ? $ids : [$ids];
            $query->where_in($this->related_pivot_key, $ids);
        }

        return $query->delete();
    }

    /**
     * Synchronize the pivot table with the given set of ids.
     *
     * Attaches missing, updates existing with provided attributes, and
     * optionally detaches records not present when detaching is enabled.
     * Returns a change summary keyed by action.
     *
     * @param mixed $ids Array or map of ids to attributes, or single id
     * @param bool $detaching Whether to remove records not in the provided set
     * @return array Summary of changes: attached, detached, updated
     * @since 1.0.0
     */
    public function sync($ids, $detaching = true)
    {
        $changes = [
            'attached' => [],
            'detached' => [],
            'updated' => [],
        ];

        $current = $this->get_current_pivot_ids();

        if (is_array($ids)) {
            $records = [];
            foreach ($ids as $id => $attributes) {
                if (!is_array($attributes)) {
                    [$id, $attributes] = [$attributes, []];
                }
                $records[$id] = $attributes;
            }
        } else {
            $records = array_fill_keys((array) $ids, []);
        }

        $detach = array_diff($current, array_keys($records));

        if ($detaching && count($detach) > 0) {
            $this->detach($detach);
            $changes['detached'] = $detach;
        }

        foreach ($records as $id => $attributes) {
            if (!in_array($id, $current)) {
                $this->attach($id, $attributes);
                $changes['attached'][] = $id;
            } elseif (count($attributes) > 0) {
                $this->update_existing_pivot($id, $attributes);
                $changes['updated'][] = $id;
            }
        }

        return $changes;
    }

    /**
     * Sync the pivot records without detaching missing ones.
     *
     * A convenience wrapper around sync that preserves existing attachments
     * while adding and updating as needed.
     *
     * @param mixed $ids Array or map of ids to attributes, or single id
     * @return array Summary of changes from the sync operation
     * @since 1.0.0
     */
    public function syncWithoutDetaching($ids)
    {
        return $this->sync($ids, false);
    }

    /**
     * Toggle the attachment state for the given ids.
     *
     * Attaches ids that are not currently related and detaches those that are.
     * Returns a summary of attachments and detachments performed.
     *
     * @param mixed $ids One id, array of ids, or variadic list
     * @return array Summary of attachments and detachments
     * @since 1.0.0
     */
    public function toggle($ids)
    {
        $changes = [
            'attached' => [],
            'detached' => [],
        ];

        $ids = is_array($ids) ? $ids : func_get_args();
        $current = $this->get_current_pivot_ids();

        foreach ($ids as $id) {
            if (in_array($id, $current)) {
                $this->detach($id);
                $changes['detached'][] = $id;
            } else {
                $this->attach($id);
                $changes['attached'][] = $id;
            }
        }

        return $changes;
    }

    /**
     * Retrieve the currently attached related ids from the pivot table.
     *
     * Queries the pivot for the related pivot key where the foreign pivot key
     * matches the parent, and returns a plain array of ids.
     *
     * @return array The list of currently attached related ids
     * @since 1.0.0
     */
    protected function get_current_pivot_ids()
    {
        $query = $this->parent::query()
            ->from($this->pivot_table)
            ->where(
                $this->foreign_pivot_key,
                '=',
                $this->parent->get_attribute($this->parent_key)
            )
            ->select([$this->related_pivot_key]);

        return $query->get()->pluck($this->related_pivot_key)->all();
    }

    /**
     * Update attributes for an existing pivot record.
     *
     * Applies timestamp updates when needed and issues an update against the
     * pivot table constrained by the parent and related keys.
     *
     * @param mixed $id The related model id whose pivot row to update
     * @param array $attributes The attributes to update on the pivot row
     * @return void No return value
     * @since 1.0.0
     */
    protected function update_existing_pivot($id, array $attributes)
    {
        $this->add_timestamps_to_pivot($attributes, true);

        $query = $this->parent::query()->from($this->pivot_table);

        $query->where($this->foreign_pivot_key, '=', $this->parent->get_attribute($this->parent_key))
            ->where($this->related_pivot_key, '=', $id)
            ->update($attributes);
    }

    /**
     * Ensure pivot records include created_at and updated_at timestamps.
     *
     * Adds timestamps when missing on insert and always sets updated_at. When
     * invoked for updates, created_at is not overwritten if present.
     *
     * @param array $record The pivot attributes being inserted or updated
     * @param bool $update Whether this is an update operation
     * @return void No return value
     * @since 1.0.0
     */
    protected function add_timestamps_to_pivot(array &$record, $update = false)
    {
        $timestamp = date('Y-m-d H:i:s');

        if (!$update && !isset($record['created_at'])) {
            $record['created_at'] = $timestamp;
        }

        if (!isset($record['updated_at'])) {
            $record['updated_at'] = $timestamp;
        }
    }

    /**
     * Public wrapper for updating attributes on an existing pivot row.
     *
     * Provides a stable external API while delegating to the internal update
     * method to perform the constrained update against the pivot table.
     *
     * @param mixed $id The related id to update on the pivot
     * @param array $attributes The attributes to write to the pivot row
     * @return void No return value
     * @since 1.0.0
     */
    public function updateExistingPivot($id, array $attributes)
    {
        return $this->update_existing_pivot($id, $attributes);
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
        return $this->parent_key;
    }
}
