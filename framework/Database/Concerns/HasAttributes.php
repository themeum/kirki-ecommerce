<?php

namespace Kirki\Ecommerce\Database\Concerns;

use Brick\Math\BigDecimal;
use Brick\Math\Exception\MathException;
use Brick\Math\RoundingMode;
use DateTimeInterface;
use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Connection\Connection;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Somoy;
use Kirki\Ecommerce\Supports\Facades\Date;
use Exception;
use InvalidArgumentException;

use function Kirki\Ecommerce\app;
use function Kirki\Ecommerce\collection;

trait HasAttributes
{
    /**
     * The model's current attribute values.
     *
     * @var array
     */
    protected $attributes = [];

    /**
     * The original attribute values at the time of model instantiation.
     *
     * @var array
     */
    protected $original = [];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [];

    /**
     * The date format for the model.
     *
     * @var string|null
     */
    protected $date_format;

    /**
     * Retrieve an attribute or loaded relation value.
     *
     * Returns cast attribute values when present, falls back to loaded
     * relations, then attempts to resolve relation methods dynamically. Null
     * is returned when no value can be resolved.
     *
     * @param string $key The attribute or relation name
     * @return mixed The resolved value or null when absent
     * @since 1.0.0
     */
    public function get_attribute($key)
    {
        if (!$key) {
            return null;
        }

        $value = null;

        if (array_key_exists($key, $this->attributes)) {
            $value = $this->cast_attribute($key, $this->attributes[$key]);
        } elseif (array_key_exists($key, $this->relations)) {
            $value = $this->relations[$key];
        } elseif (method_exists($this, $key)) {
            $value = $this->get_relation_value($key);
        }

        if ($this->has_get_mutator($key)) {
            $value = $this->get_mutated_attribute_value($key, $value);
        }

        return $value;
    }

    /**
     * Get the attributes array.
     *
     * @return array
     * @since 1.0.0
     */
    public function get_attributes(): array
    {
        return $this->attributes;
    }

    /**
     * Set a raw attribute value on the model.
     *
     * Assigns the provided value without casting and returns the model instance
     * for fluent chaining during construction or updates.
     *
     * @param string $key The attribute name to set
     * @param mixed $value The value to assign
     * @return $this The model instance for method chaining
     * @since 1.0.0
     */
    public function set_attribute($key, $value)
    {
        if ($this->has_set_mutator($key)) {
            $value = $this->set_mutated_attribute_value($key, $value);
        }

        $this->attributes[$key] = $value;

        return $this;
    }

    /**
     * Set raw attributes on the model without checking any fillable or guarded attributes.
     *
     * Assigns the provided attributes without casting and returns the model instance
     * for fluent chaining during construction or updates.
     *
     * @param array $attributes The attributes to set
     * @return $this The model instance for method chaining
     * @since 1.0.0
     */
    public function set_attributes(array $attributes)
    {
        $this->attributes = $attributes;

        return $this;
    }

    /**
     * Set raw attributes on the model.
     *
     * Assigns the provided attributes without casting and returns the model instance
     * for fluent chaining during construction or updates.
     *
     * @param array $attributes The attributes to set
     * @param bool $sync Whether to sync the original attributes
     * @return $this The model instance for method chaining
     * @since 1.0.0
     */
    public function set_raw_attributes(array $attributes, $sync = false)
    {
        $this->attributes = $attributes;

        if ($sync) {
            $this->sync_original();
        }

        return $this;
    }

    /**
     * Sync the original attributes with the current attributes.
     *
     * @return static The model instance for method chaining
     * @since 1.0.0
     */
    public function sync_original()
    {
        $this->original = $this->get_attributes();

        return $this;
    }

    /**
     * Get the casts array.
     *
     * @return array
     * @since 1.0.0
     */
    public function get_casts()
    {
        return $this->casts;
    }

    /**
     * Merge the given casts with the existing casts.
     *
     * @param array $casts The casts to merge
     * @return $this The model instance for method chaining
     * @since 1.0.0
     */
    public function merge_casts($casts)
    {
        $this->casts = array_merge($this->casts, $casts);

        return $this;
    }

    /**
     * Check if the model has a set mutator for the given attribute.
     *
     * @param string $key The attribute name to check
     * @return bool Whether the model has a set mutator for the attribute
     * @since 1.0.0
     */
    protected function has_set_mutator($key)
    {
        return method_exists($this, $this->make_set_mutator_method($key));
    }

    /**
     * Set a mutated attribute value on the model.
     *
     * @param string $key The attribute name to set
     * @param mixed $value The value to assign
     * @return mixed The set value
     * @since 1.0.0
     */
    protected function set_mutated_attribute_value($key, $value)
    {
        $mutator_method = $this->make_set_mutator_method($key);

        return $this->{$mutator_method}($value, $this->attributes);
    }

    /**
     * Get the mutator method name for setting an attribute.
     *
     * @param string $key The attribute name to get the mutator method for
     * @return string The mutator method name
     * @since 1.0.0
     */
    protected function make_set_mutator_method($key)
    {
        return 'set_' . $key . '_attribute';
    }

    /**
     * Get the mutator method name for getting an attribute.
     *
     * @param string $key The attribute name to get the mutator method for
     * @return string The mutator method name
     * @since 1.0.0
     */
    protected function make_get_mutator_method($key)
    {
        return 'get_' . $key . '_attribute';
    }

    /**
     * Check if the model has a get mutator for the given attribute.
     *
     * @param string $key The attribute name to check
     * @return bool Whether the model has a get mutator for the attribute
     * @since 1.0.0
     */
    protected function has_get_mutator($key)
    {
        return method_exists($this, $this->make_get_mutator_method($key));
    }

    /**
     * Get a mutated attribute value from the model.
     *
     * @param string $key The attribute name to get
     * @param mixed $value The value to mutate
     * 
     * @return mixed The get value
     * @since 1.0.0
     */
    protected function get_mutated_attribute_value($key, $value)
    {
        $mutator_method = $this->make_get_mutator_method($key);

        return $this->{$mutator_method}($value, $this->attributes);
    }

    /**
     * Cast an attribute to its configured type.
     *
     * Applies casting rules defined on the model to normalize values retrieved
     * from the database into their expected PHP types or structures.
     *
     * @param string $key The attribute name being cast
     * @param mixed $value The raw value to cast
     * @return mixed The casted value according to the model's rules
     * @since 1.0.0
     */
    protected function cast_attribute($key, $value)
    {
        if (!isset($this->casts[$key])) {
            return $value;
        }

        $cast_type = $this->get_cast_type($this->casts[$key]);

        switch ($cast_type) {
            case 'int':
            case 'integer':
                return (int) $value;
            case 'real':
            case 'float':
            case 'double':
                return (float) $value;
            case 'decimal':
                return $this->as_decimal($value, explode(':', $this->casts[$key], 2)[1] ?? 2);
            case 'string':
                return (string) $value;
            case 'bool':
            case 'boolean':
                return (bool) $value;
            case 'object':
                return $this->from_json($value, true);
            case 'array':
            case 'json':
                return is_array($value) ? $value : $this->from_json($value);
            case 'date':
                return $this->as_date($value);
            case 'datetime':
                return $this->as_date_time($value);
            case 'timestamp':
                return $this->as_timestamp($value);
            default:
                return $value;
        }
    }

    protected function get_cast_type($cast)
    {
        if (empty($cast)) {
            return null;
        }

        $parts = explode(':', $cast, 2);

        return $parts[0];
    }

    /**
     * Convert a JSON string to a PHP value.
     *
     * @param string $value The JSON string to convert
     * @param bool $as_object Whether to convert the JSON string to an object
     * @return mixed The PHP value
     */
    protected function from_json($value, $as_object = false)
    {
        if (empty($value)) {
            return null;
        }

        return json_decode($value, !$as_object);
    }

    /**
     * Convert a value to a decimal.
     *
     * @param mixed $value The value to convert
     * @param int $precision The precision of the decimal
     * @return string The decimal value
     * @throws Exception If the value cannot be converted to a decimal
     */
    protected function as_decimal($value, $precision)
    {
        try {
            return (string) BigDecimal::of($value)->toScale($precision, RoundingMode::HALF_UP);
        } catch (MathException $e) {
            throw new Exception(sprintf('Unable to cast value as decimal: %s', $e->getMessage()));
        }
    }

    /**
     * Convert a value to a date.
     *
     * @param mixed $value The value to convert
     * @return Somoy The date value
     */
    protected function as_date($value)
    {
        return $this->as_date_time($value)->start_of_day();
    }

    /**
     * Convert a value to a date time.
     *
     * @param mixed $value The value to convert
     * @return Somoy The date time value
     */
    protected function as_date_time($value)
    {
        if ($value instanceof Somoy) {
            return Date::instance($value);
        }

        if ($value instanceof DateTimeInterface) {
            return Date::parse(
                $value->format('Y-m-d H:i:s.u'),
                $value->getTimezone(),
            );
        }

        if (is_numeric($value)) {
            return Date::create_from_timestamp($value, date_default_timezone_get());
        }

        if ($this->is_standard_date_format($value)) {
            return Date::instance(Date::create_from_format('Y-m-d', $value))->start_of_day();
        }

        $format = $this->get_date_format();

        try {
            $date = Date::create_from_format($format, $value);
        } catch (InvalidArgumentException $exception) {
            $date = false;
        }

        return $date ?: Date::parse($value);
    }

    /**
     * Check if a value is in the standard date format.
     *
     * @param mixed $value The value to check
     * @return bool Whether the value is in the standard date format
     */
    protected function is_standard_date_format($value)
    {
        return preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $value);
    }

    /**
     * Get the date format for the model.
     *
     * @return string The date format
     */
    protected function get_date_format()
    {
        return $this->date_format ?: app()
            ->make(Connection::class)
            ->get_query_compiler()
            ->get_date_format();
    }

    /**
     * Convert a value to a timestamp.
     *
     * @param mixed $value The value to convert
     * @return int The timestamp value
     */
    protected function as_timestamp($value)
    {
        return $this->as_date_time($value)->get_timestamp();
    }

    /**
     * Get the attributes that have been modified since last sync.
     *
     * Compares current attributes to the original snapshot and returns a
     * key-value array of changed fields to be persisted during update.
     *
     * @return array The changed attributes keyed by column name
     * @since 1.0.0
     */
    protected function get_dirty()
    {
        $dirty = [];

        foreach ($this->attributes as $key => $value) {
            if (!$this->original_is_equivalent($key)) {
                $dirty[$key] = $value;
            }
        }

        return $dirty;
    }

    /**
     * Check if the original value is equivalent to the current value.
     *
     * @param string $key The attribute key
     * @return bool Whether the original value is equivalent to the current value
     */
    public function original_is_equivalent($key)
    {
        if (!array_key_exists($key, $this->original)) {
            return false;
        }

        $attribute = $this->attributes[$key] ?? null;
        $original = $this->original[$key] ?? null;

        if ($attribute === $original) {
            return true;
        }

        if (is_null($attribute)) {
            return false;
        }

        if ($this->is_date_attribute($key)) {
            return $this->from_date_time($attribute) === $this->from_date_time($original);
        }

        if ($this->has_cast($key, ['object'])) {
            return $this->from_json($attribute) === $this->from_json($original);
        }

        if ($this->has_cast($key, ['real', 'float', 'double'])) {
            if (is_null($original)) {
                return false;
            }

            return abs($this->cast_attribute($key, $attribute) - $this->cast_attribute($key, $original)) < PHP_FLOAT_EPSILON * 4;
        }

        if (is_numeric($attribute) && is_numeric($original)) {
            return strcmp((string) $attribute, (string) $original) === 0;
        }

        return $attribute === $original;
    }

    /**
     * Check if the attribute is a date attribute.
     *
     * @param string $key The attribute key
     * @return bool Whether the attribute is a date attribute
     */
    protected function is_date_attribute($key)
    {
        return in_array($key, $this->get_date_keys(), true)
            || $this->is_date_castable($key);
    }

    /**
     * Check if the attribute is a date castable attribute.
     *
     * @param string $key The attribute key
     * @return bool Whether the attribute is a date castable attribute
     */
    protected function is_date_castable($key)
    {
        return $this->has_cast($key, ['date', 'datetime']);
    }

    /**
     * Get the date keys for the model.
     *
     * @return array The date keys
     */
    protected function get_date_keys()
    {
        return $this->timestamps ? ['created_at', 'updated_at'] : [];
    }

    /**
     * Check if the attribute has a cast.
     *
     * @param string $key The attribute key
     * @param mixed $types The cast types
     * @return bool Whether the attribute has a cast
     */
    protected function has_cast($key, $types = null)
    {
        if (array_key_exists($key, $this->get_casts())) {
            return $types ? in_array($this->get_cast_type($key), (array) $types, true) : true;
        }

        return false;
    }

    /**
     * Convert a value to a date time.
     *
     * @param mixed $value The value to convert
     * @return Somoy The date time value
     */
    public function from_date_time($value)
    {
        return empty($value)
            ? $value
            : $this->as_date_time($value)->format(
                $this->get_date_format()
            );
    }

    /**
     * Determine whether the model has been persisted.
     *
     * Checks the presence of the primary key in the original snapshot to infer
     * if the instance corresponds to an existing database row.
     *
     * @return bool True when the model exists in the database
     * @since 1.0.0
     */
    protected function exists()
    {
        return isset($this->original[$this->primary_key]);
    }

    /**
     * Determine whether the model has been modified.
     *
     * @param mixed $attributes The attributes to check
     * @return bool True when the model has been modified
     * @since 1.0.0
     */
    public function is_dirty($attributes = null)
    {
        return $this->has_changed(
            $this->get_dirty(),
            is_array($attributes) ? $attributes : func_get_args()
        );
    }

    /**
     * Determine whether the model has not been modified.
     *
     * @param mixed $attributes The attributes to check
     * @return bool True when the model has not been modified
     * @since 1.0.0
     */
    public function is_clean($attributes = null)
    {
        return !$this->is_dirty(...func_get_args());
    }

    /**
     * Summary of has_changed
     * @param mixed $changes
     * @param mixed $attributes
     * @return bool
     */
    protected function has_changed($changes, $attributes = null)
    {
        if (empty($attributes)) {
            return count($changes) > 0;
        }

        return collection(Arr::wrap($attributes))
            ->some(fn($attribute) => array_key_exists($attribute, $changes));
    }

    /**
     * Convert the model's attributes to an array.
     *
     * @return array The attributes array
     */
    public function attributes_to_array()
    {
        $attributes = $this->resolve_date_attributes(
            $this->get_attributes()
        );

        $attributes = $this->resolve_casted_attributes(
            $attributes
        );

        $attributes = $this->resolve_mutated_attributes(
            $attributes
        );

        return $attributes;
    }

    /**
     * Resolve date attributes.
     *
     * @param array $attributes The attributes to resolve
     * @return array The resolved attributes
     */
    protected function resolve_date_attributes(array $attributes)
    {
        foreach ($this->get_date_keys() as $key) {
            if (!isset($attributes[$key])) {
                continue;
            }

            $attributes[$key] = $this->serialize_date(
                $this->as_date_time($attributes[$key])
            );
        }

        return $attributes;
    }

    /**
     * Resolve casted attributes.
     *
     * @param array $attributes The attributes to resolve
     * @return array The resolved attributes
     */
    protected function resolve_casted_attributes(array $attributes)
    {
        foreach ($this->get_casts() as $key => $value) {
            // Skip casting if the attribute key is not present in the attributes array.
            // Cast definitions may exist for attributes not loaded in the current instance.
            if (!isset($attributes[$key])) {
                continue;
            }

            $attributes[$key] = $this->cast_attribute($key, $attributes[$key]);

            if (isset($attributes[$key]) && in_array($value, ['date', 'datetime'], true)) {
                $attributes[$key] = $this->serialize_date($attributes[$key]);
            }

            if ($attributes[$key] instanceof DateTimeInterface) {
                $attributes[$key] = $this->serialize_date($attributes[$key]);
            }

            if ($attributes[$key] instanceof Arrayable) {
                $attributes[$key] = $attributes[$key]->to_array();
            }
        }

        return $attributes;
    }

    /**
     * Resolve mutated attributes.
     *
     * @param array $attributes The attributes to resolve
     * @return array The resolved attributes
     */
    protected function resolve_mutated_attributes(array $attributes)
    {
        foreach ($attributes as $key => $value) {
            if ($this->has_get_mutator($key)) {
                $attributes[$key] = $this->get_mutated_attribute_value($key, $value);
            }
        }

        return $attributes;
    }

    /**
     * Serialize a date.
     *
     * @param DateTimeInterface $date The date to serialize
     * @return string The serialized date
     */
    protected function serialize_date(DateTimeInterface $date)
    {
        return Somoy::instance($date)->to_json();
    }

    /**
     * Convert the model's relations to an array.
     *
     * @return array The relations array
     */
    public function relations_to_array()
    {
        $attributes = [];

        foreach ($this->relations as $key => $value) {
            if ($value instanceof Arrayable) {
                $relation = $value->to_array();
            } elseif (is_null($value)) {
                $relation = $value;
            }

            if (array_key_exists('relation', get_defined_vars())) {
                $attributes[$key] = $relation ?? null;
            }

            unset($relation);
        }

        return $attributes;
    }
}
