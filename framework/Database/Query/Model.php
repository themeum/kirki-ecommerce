<?php

namespace Kirki\Ecommerce\Database\Query;

use ArrayAccess;
use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Contracts\Support\Jsonable;
use Kirki\Ecommerce\Database\Concerns\HasAttributes;
use Kirki\Ecommerce\Database\Concerns\HasRelationships;
use Kirki\Ecommerce\Database\Connection\Connection;
use Kirki\Ecommerce\Database\Query\Relations\Relation;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Supports\Traits\Macroable;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Concerns\GuardAttributes;
use Kirki\Ecommerce\Supports\Facades\Date;
use Exception;
use JsonSerializable;
use ReflectionClass;

use function Kirki\Ecommerce\app;
use function Kirki\Ecommerce\collection;

/**
 * Provide an active record style base model for the Query Builder.
 *
 * Encapsulate table naming, attribute handling, persistence operations, and
 * relationship definitions. Models interact with the query builder to perform
 * CRUD operations, handle casting, timestamps, hydration, and eager loading
 * of related records for a cohesive developer experience.
 *
 * @since 1.0.0
 */
abstract class Model implements Arrayable, Jsonable, ArrayAccess, JsonSerializable
{
    use Macroable,
        HasAttributes,
        GuardAttributes,
        HasRelationships;

    /**
     * The shared database connection instance for all models.
     *
     * @var Connection|null
     */
    protected static $connection = null;

    /**
     * The name of the database table associated with the model.
     *
     * @var string
     */
    protected $table;

    /**
     * The primary key column name for the model.
     *
     * @var string
     */
    protected $primary_key = 'id';

    /**
     * Indicates if the model should automatically manage created_at and updated_at timestamps.
     *
     * @var bool
     */
    protected $timestamps = true;

    /**
     * The model's loaded relationship instances.
     *
     * @var array
     */
    public $relations = [];

    /**
     * The relations to count that would be eager loaded on every query
     *
     * @var array
     */
    protected $with_count = [];

    /**
     * The models that have been booted.
     *
     * @var array
     */
    protected static $booted = [];

    /**
     * Indicates if the model exists in the database.
     *
     * @var bool
     */
    protected bool $exists = false;

    /**
     * Construct a new model instance optionally seeded with attributes.
     *
     * Fills the model using mass assignment rules and snapshots the original
     * attributes for dirty tracking. The instance starts in a non-persisted
     * state until saved for the first time.
     *
     * @param array $attributes The initial attribute values
     * @return void No return value
     * @since 1.0.0
     */
    public function __construct(array $attributes = [])
    {
        $this->boot_if_not_booted();

        $this->fill($attributes);
        $this->original = $this->attributes;
    }

    /**
     * Boot the model if it has not been booted yet.
     *
     * @return void No return value
     * @since 1.0.0
     */
    protected function boot_if_not_booted()
    {
        if (!isset(static::$booted[static::class])) {
            static::$booted[static::class] = true;
            static::booting();
            static::boot();
            static::booted();
        }
    }

    /**
     * The booting event.
     *
     * @return void No return value
     * @since 1.0.0
     */
    protected function booting()
    {
        //
    }

    /**
     * The boot event.
     *
     * @return void No return value
     * @since 1.0.0
     */
    protected function boot()
    {
        //
    }

    /**
     * The booted event.
     *
     * @return void No return value
     * @since 1.0.0
     */
    protected function booted()
    {
        //
    }

    /**
     * Set the shared database connection used by all models.
     *
     * Allows applications and tests to inject a specific connection instance
     * for use when building and executing queries across model operations.
     *
     * @param Connection $connection The connection to assign
     * @return void No return value
     * @since 1.0.0
     */
    public static function setConnection(Connection $connection)
    {
        static::$connection = $connection;
    }

    /**
     * Retrieve the active connection, creating it on first use.
     *
     * Lazily resolves the singleton connection from the Connection manager
     * when a model requires database access. Ensures a single shared instance
     * is used throughout the application lifecycle.
     *
     * @return Connection The active database connection
     * @since 1.0.0
     */
    protected static function get_connection()
    {
        return app()->make(Connection::class);
    }

    /**
     * Determine the database table name for the model.
     *
     * Returns the explicitly set table when provided; otherwise infers the
     * table by lowercasing the class base name and appending an "s" suffix.
     *
     * @return string The table name associated with the model
     * @since 1.0.0
     */
    public function get_table()
    {
        if (isset($this->table)) {
            return $this->table;
        }

        $class_name = (new ReflectionClass($this))->getShortName();
        $table_name = strtolower($class_name) . 's';

        return $table_name;
    }

    /**
     * Set the database table name for the model.
     *
     * @param string $table The table name to assign
     * @return static The model instance for method chaining
     * @since 1.0.0
     */
    public function set_table($table)
    {
        $this->table = $table;

        return $this;
    }

    /**
     * Get the route key name for the model.
     *
     * @return string The route key name
     *
     * @since 1.0.0
     */
    public function get_route_key()
    {
        return $this->primary_key;
    }

    /**
     * Get the primary key name for the model.
     *
     * @return string The primary key name
     * @since 1.0.0
     */
    public function get_primary_key()
    {
        return $this->primary_key;
    }

    /**
     * Get the fillable attributes for the model.
     *
     * @return array The fillable attributes
     * @since 1.0.0
     */
    public function get_fillable()
    {
        return $this->fillable;
    }

    /**
     * Prepare the column name for the query.
     *
     * @param string $column The column name to prepare
     * @return string The prepared column name
     * @since 1.0.0
     */
    public function prepare_column($column)
    {
        if (str_contains($column, '.')) {
            return $column;
        }

        return $this->get_table() . '.' . $column;
    }

    /**
     * Get the prepared primary key name for the query.
     *
     * @return string The prepared primary key name
     * @since 1.0.0
     */
    public function get_prepared_key_name()
    {
        return $this->prepare_column($this->get_primary_key());
    }

    /**
     * Prepare the columns for the query.
     *
     * @param array $columns The columns to prepare
     * @return array The prepared columns
     * @since 1.0.0
     */
    public function prepare_columns($columns)
    {
        $columns = Arr::wrap($columns);

        return collection($columns)
            ->map(fn($column) => $this->prepare_column($column))
            ->all();
    }

    /**
     * Create a new instance of the model.
     *
     * @param array $attributes The attributes to set
     * @return static The new instance
     *
     * @since 1.0.0
     */
    public function new_instance($attributes = [], $exists = false)
    {
        $model = new static;

        $model->exists = $exists;

        $model->set_table($this->get_table());
        $model->merge_casts($this->casts);
        $model->set_raw_attributes($attributes, true);

        return $model;
    }

    /**
     * Create a new instance of the model with fillable attributes.
     *
     * @param array $attributes The attributes to set
     * @return static The new instance
     *
     * @since 1.0.0
     */
    public function new_fillable_instance($attributes = [])
    {
        $model = new static;

        $model->set_table($this->get_table());
        $model->merge_casts($this->casts);
        $model->fill($attributes);

        return $model;
    }

    /**
     * Create a new query builder instance for the model's table.
     *
     * Instantiates a fresh model to determine the table and returns a
     * configured query builder bound to this model class for fluent query
     * construction and result hydration.
     *
     * @return QueryBuilder The query builder targeting this model's table
     * @since 1.0.0
     */
    public static function query()
    {
        return new QueryBuilder(
            static::get_connection(),
            static::get_connection()->get_query_compiler(),
            new static()
        );
    }

    /**
     * Create a new query builder instance for the model's table.
     *
     * Instantiates a fresh model to determine the table and returns a
     * configured query builder bound to this model class for fluent query
     * construction and result hydration.
     *
     * @return QueryBuilder The query builder targeting this model's table
     * @since 1.0.0
     */
    public function new_query()
    {
        return new QueryBuilder(
            $this->get_connection(),
            $this->get_connection()->get_query_compiler(),
            $this
        );
    }

    /**
     * Retrieve all records for the model.
     *
     * Builds a basic select query and returns a collection of hydrated model
     * instances representing all rows in the corresponding table.
     *
     * @return Collection A collection of model instances
     * @since 1.0.0
     */
    public static function all($columns = ['*'])
    {
        return static::query()->get(
            is_array($columns) ? $columns : func_get_args()
        );
    }

    /**
     * Retrieve a model instance by its primary key.
     *
     * @param int $id The primary key of the record to find
     * @return Model The hydrated model instance
     * @since 1.0.0
     */
    public static function find(int $id)
    {
        return static::query()->find($id, (new static())->primary_key);
    }

    /**
     * Create and persist a new model instance.
     *
     * Mass assigns the provided attributes, saves the model, and returns the
     * fresh instance. Fillable and guarded rules apply during assignment.
     *
     * @param array $attributes The attributes to assign and persist
     * @return static The newly created, persisted model instance
     * @since 1.0.0
     */
    public static function create(array $attributes)
    {
        $instance = new static($attributes);
        $instance->save();

        return $instance;
    }

    /**
     * Persist the model to the database.
     *
     * Updates timestamps when enabled, then performs an insert or update
     * depending on whether the model already exists. Returns a boolean to
     * indicate success.
     *
     * @return bool True when the operation succeeds; false otherwise
     * @since 1.0.0
     */
    public function save()
    {
        if ($this->timestamps) {
            $this->update_timestamps();
        }

        if ($this->exists) {
            return $this->is_dirty()
                ? $this->perform_update()
                : true;
        }

        return $this->perform_insert();
    }

    /**
     * Insert the model as a new record in the database.
     *
     * Uses the query builder to insert attributes and capture the generated
     * primary key, then updates the original snapshot. Returns true on
     * completion to mirror successful persistence semantics.
     *
     * @return bool True when the insert completes successfully
     * @throws Exception When the insert fails
     * @since 1.0.0
     */
    protected function perform_insert()
    {
        $query = static::query();
        $id = $query->insert_get_id($this->attributes);

        $this->set_attribute($this->primary_key, $id);
        $this->original = $this->attributes;

        $this->exists = true;

        return true;
    }

    /**
     * Update the existing database record with dirty attributes.
     *
     * Computes the set of changed attributes and issues an update statement
     * scoped to the primary key. When no changes are detected, returns true to
     * indicate no action was required.
     *
     * @return bool True on success or when no changes are present
     * @since 1.0.0
     */
    protected function perform_update()
    {
        $dirty = $this->get_dirty();

        if (empty($dirty)) {
            return true;
        }

        $query = static::query()->where($this->primary_key, '=', $this->get_attribute($this->primary_key));
        $result = $query->update($dirty);

        $this->original = $this->attributes;

        return $result;
    }

    /**
     * Update attributes on the model and persist the changes.
     *
     * Merges the provided attributes using fill rules and then calls save to
     * perform the appropriate persistence action. Returns the boolean result
     * of the save operation.
     *
     * @param array $attributes The attributes to assign prior to saving
     * @return bool True when the model is saved successfully
     * @since 1.0.0
     */
    public function update(array $attributes = [])
    {
        if (!$this->exists) {
            return false;
        }

        return $this->fill($attributes)->save();
    }

    /**
     * Delete the model's record from the database.
     *
     * When the model does not yet exist, returns false. Otherwise performs a
     * delete query constrained by the primary key and returns its result.
     *
     * @return bool True when deletion succeeds; false if not persisted
     * @since 1.0.0
     */
    public function delete()
    {
        if (empty($this->get_primary_key())) {
            throw new Exception(sprintf('No primary key defined for model [%s]', static::class));
        }

        if (!$this->exists) {
            return false;
        }

        $this->perform_delete_on_model();

        return true;
    }

    /**
     * Delete the model's record from the database.
     *
     * @return void
     * @since 1.0.0
     */
    protected function perform_delete_on_model()
    {
        static::query()->where(
            $this->get_primary_key(),
            '=',
            $this->get_primary_key_value()
        )->delete();

        $this->exists = false;
    }

    /**
     * Delete one or many models by primary key.
     *
     * Accepts a single id or multiple, finds each, and deletes them when
     * present. Returns the count of successfully deleted records.
     *
     * @param mixed $ids One id, array of ids, or variadic list of ids
     * @return int The number of records deleted
     * @since 1.0.0
     */
    public static function destroy($ids)
    {
        $ids = is_array($ids) ? $ids : func_get_args();
        $count = 0;

        foreach ($ids as $id) {
            $instance = static::find($id);
            if ($instance) {
                $instance->delete();
                $count++;
            }
        }

        return $count;
    }

    /**
     * Mass assign attributes allowed by fillable/guarded rules.
     *
     * Iterates through provided attributes, only setting those permitted by the
     * model's configuration. Returns the model instance for chaining.
     *
     * @param array $attributes The attributes to attempt to assign
     * @return $this The model instance for method chaining
     * @since 1.0.0
     */
    public function fill(array $attributes)
    {
        foreach ($attributes as $key => $value) {
            if ($this->is_fillable($key)) {
                $this->set_attribute($key, $value);
            }
        }

        return $this;
    }

    /**
     * Update timestamp attributes when enabled.
     *
     * Sets updated_at on every save and created_at on initial inserts when the
     * model is configured to manage timestamps automatically.
     *
     * @return void No return value
     * @since 1.0.0
     */
    protected function update_timestamps()
    {
        $time = Date::now();

        if (!$this->exists()) {
            $this->set_attribute('created_at', $time);
        }

        $this->set_attribute('updated_at', $time);
    }

    /**
     * Hydrate a new model instance from raw data.
     *
     * Accepts an object or array of attributes, normalizes to an array, and
     * sets both current and original states. Used by query results to produce
     * model instances.
     *
     * @param mixed $data The source attributes as object or array
     * @return static The hydrated model instance
     * @since 1.0.0
     */
    public function hydrate($attributes)
    {
        if (is_object($attributes)) {
            $attributes = get_object_vars($attributes);
        }

        $instance = $this->new_instance($attributes, true);

        return $instance;
    }




    /**
     * Eager load one or more relations onto the model.
     *
     * Accepts a single relation or multiple and assigns the retrieved results
     * to the model's relations array for later access and serialization.
     *
     * @param mixed $relations The relation name(s) to load
     * @return static The model instance for method chaining
     * @since 1.0.0
     */
    public function load($relations)
    {
        $relations = is_array($relations) ? $relations : func_get_args();

        $query = $this->new_query_without_relations()->with(
            is_string($relations) ? func_get_args() : $relations
        );

        $query->eager_load_relations([$this]);

        return $this;
    }

    /**
     * Create a new query builder instance for the model's table.
     *
     * Instantiates a fresh model to determine the table and returns a
     * configured query builder bound to this model class for fluent query
     * construction and result hydration.
     *
     * @return QueryBuilder The query builder targeting this model's table
     * @since 1.0.0
     */
    public function new_query_without_relations()
    {
        return $this->new_query();
    }

    /**
     * Infer the foreign key name for the model.
     *
     * Uses the lowercase short class name with an _id suffix to determine the
     * conventional foreign key column name used on related tables.
     *
     * @return string The inferred foreign key column name
     * @since 1.0.0
     */
    protected function get_foreign_key()
    {
        return strtolower((new ReflectionClass($this))->getShortName()) . '_id';
    }

    /**
     * Compute a conventional pivot table name for two tables.
     *
     * Sorts the provided table names alphabetically and joins them with an
     * underscore to produce a deterministic pivot table name.
     *
     * @param string $table1 The first table name
     * @param string $table2 The second table name
     * @return string The generated pivot table name
     * @since 1.0.0
     */
    protected function get_pivot_table_name($table1, $table2)
    {
        $tables = [$table1, $table2];
        sort($tables);
        return implode('_', $tables);
    }

    /**
     * Get a fresh model instance from the database.
     *
     * @param array|string $with The relations to load
     * @return static|null The fresh model instance
     * @since 1.0.0
     */
    public function fresh($with = [])
    {
        if (!$this->exists) {
            return;
        }

        return $this->set_where_for_fresh_query($this->new_query())
            ->with(is_string($with) ? func_get_args() : $with)
            ->first();
    }

    /**
     * Refresh the model instance from the database.
     *
     * @return static The refreshed model instance
     * @since 1.0.0
     */
    public function refresh()
    {
        if (!$this->exists) {
            return $this;
        }

        $this->set_raw_attributes(
            $this->set_where_for_fresh_query($this->new_query())
                ->first()
                ->get_attributes()
        );

        if (!empty($this->relations)) {
            $this->load($this->relations);
        }

        $this->sync_original();

        return $this;
    }

    /**
     * Set the where clause for a fresh query.
     *
     * @param QueryBuilder $query The query builder instance
     * @return QueryBuilder The query builder instance
     * @since 1.0.0
     */
    protected function set_where_for_fresh_query(QueryBuilder $query)
    {
        $query->where(
            $this->get_primary_key(),
            '=',
            $this->get_primary_key_value()
        );

        return $query;
    }

    /**
     * Get the primary key value.
     *
     * @return mixed The primary key value
     * @since 1.0.0
     */
    protected function get_primary_key_value()
    {
        return $this->original[$this->get_primary_key()] ?? $this->get_attribute($this->get_primary_key());
    }

    /**
     * Convert the model and loaded relations to an array.
     *
     * Serializes attributes and recursively converts relation values to arrays
     * to produce a structure suitable for JSON encoding or API responses.
     *
     * @return array The array representation of the model
     * @since 1.0.0
     */
    public function to_array()
    {
        return array_merge(
            $this->attributes_to_array(),
            $this->relations_to_array()
        );
    }


    /**
     * Determine if the model has a named scope.
     *
     * @param string $scope The scope name to check
     * @return bool True when the scope exists; false otherwise
     * @since 1.0.0
     */
    public function has_named_scope(string $scope)
    {
        return method_exists($this, 'scope_' . $scope);
    }

    /**
     * Call a named scope on the model.
     *
     * @param string $scope The scope name to call
     * @param array $parameters The parameters to pass to the scope
     * @return mixed The result of the scope call
     * @since 1.0.0
     */
    public function call_named_scope(string $scope, ...$parameters)
    {
        $method = 'scope_' . $scope;

        return $this->$method(...$parameters);
    }

    /**
     * Convert the model and relations to a JSON string.
     *
     * Utilizes json_encode on the array form of the model. Useful for logging
     * and simple serialization needs without a dedicated resource layer.
     *
     * @return string The JSON-encoded representation of the model
     * @since 1.0.0
     */
    public function to_json($options = 0)
    {
        return Arr::json_encode($this->to_array(), $options);
    }

    /**
     * Get an attribute or relation.
     *
     * @param string $offset The attribute or relation key to get
     * @return mixed The value of the attribute or relation
     * @since 1.0.0
     */
    public function offsetGet($offset): mixed
    {
        return $this->get_attribute($offset);
    }

    /**
     * Set an attribute or relation.
     *
     * @param string $offset The attribute or relation key to set
     * @param mixed $value The value to assign to the attribute or relation
     * @return void No return value
     * @since 1.0.0
     */
    public function offsetSet($offset, $value): void
    {
        $this->set_attribute($offset, $value);
    }

    /**
     * Check if an attribute or relation is set.
     *
     * @param string $offset The attribute or relation key to check
     * @return bool True when a value is present; false otherwise
     * @since 1.0.0
     */
    public function offsetExists($offset): bool
    {
        return isset($this->attributes[$offset]) || isset($this->relations[$offset]);
    }

    /**
     * Unset an attribute or relation.
     *
     * @param string $offset The attribute or relation key to unset
     * @return void No return value
     * @since 1.0.0
     */
    public function offsetUnset($offset): void
    {
        unset(
            $this->attributes[$offset],
            $this->relations[$offset]
        );
    }

    /**
     * Convert the model to a JSON serializable array.
     *
     * @return array The model's attributes and relations
     * @since 1.0.0
     */
    public function jsonSerialize(): mixed
    {
        return $this->to_array();
    }

    /**
     * Dynamically retrieve attributes or relations via property access.
     *
     * Forwards to get_attribute to keep behavior consistent with explicit
     * accessor calls while supporting PHP's magic access pattern.
     *
     * @param string $key The attribute or relation name
     * @return mixed The resolved value or null when absent
     * @since 1.0.0
     */
    public function __get($key)
    {
        return $this->get_attribute($key);
    }

    /**
     * Dynamically set attribute values via property access.
     *
     * Forwards to set_attribute to ensure consistent mutation behavior and
     * chaining semantics when used programmatically.
     *
     * @param string $key The attribute name
     * @param mixed $value The value to assign
     * @return void No return value
     * @since 1.0.0
     */
    public function __set($key, $value)
    {
        $this->set_attribute($key, $value);
    }

    /**
     * Determine if an attribute or relation is set.
     *
     * Checks both the attributes and relations arrays to report whether the
     * given key currently resolves to a non-null value.
     *
     * @param string $key The attribute or relation key to test
     * @return bool True when a value is present; false otherwise
     * @since 1.0.0
     */
    public function __isset($key)
    {
        return $this->offsetExists($key);
    }

    /**
     * Unset an attribute or relation.
     *
     * @param string $key The attribute or relation key to unset
     * @return void No return value
     * @since 1.0.0
     */
    public function __unset($key)
    {
        $this->offsetUnset($key);
    }

    /**
     * Resolve a relation value from a method when available.
     *
     * Attempts to call the relation method and retrieve its results if the
     * method exists, returning null when it does not.
     *
     * @param string $key The relation method name
     * @return mixed The relation results or null
     * @since 1.0.0
     */
    protected function get_relation_value($key)
    {
        if (method_exists($this, $key)) {
            return $this->get_relationship_from_method($key);
        }

        return null;
    }

    /**
     * Invoke a relation method and store its results on the model.
     *
     * Ensures the returned value is a valid Relation instance, then queries
     * and assigns the results to the relations array under the method name.
     *
     * @param string $method The relation method name to invoke
     * @return mixed The loaded relation results or null when not a relation
     * @since 1.0.0
     */
    protected function get_relationship_from_method($method)
    {
        $relation = $this->$method();

        if (!$relation instanceof Relation) {
            return null;
        }

        return $this->relations[$method] = $relation->get_results();
    }

    /**
     * Dynamically call a method on the query builder.
     *
     * @param string $method The method name to call
     * @param array $arguments The arguments to pass to the method
     * @return mixed The result of the method call
     * @since 1.0.0
     */
    public function __call($method, $arguments)
    {
        return $this->query()->$method(...$arguments);
    }

    /**
     * Dynamically call a static method on the model.
     *
     * @param string $method The method name to call
     * @param array $arguments The arguments to pass to the method
     * @return mixed The result of the method call
     * @since 1.0.0
     */
    public static function __callStatic($method, $arguments)
    {
        return (new static())->$method(...$arguments);
    }
}
