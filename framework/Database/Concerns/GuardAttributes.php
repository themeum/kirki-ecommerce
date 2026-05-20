<?php

namespace Kirki\Ecommerce\Database\Concerns;

trait GuardAttributes
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [];

    /**
     * The attributes that should be protected from mass assignment.
     *
     * @var array
     */
    protected $guarded = ['*'];

    /**
     * Indicates if all mass assignment is allowed.
     *
     * @var bool
     */
    protected static $unguarded = false;

    /**
     * Get the fillable attributes for the model.
     *
     * @return array
     */
    public function get_fillable()
    {
        return $this->fillable;
    }

    /**
     * Set the fillable attributes for the model.
     *
     * @param array $fillable
     * @return $this
     */
    public function fillable(array $fillable)
    {
        $this->$fillable = $fillable;

        return $this;
    }

    /**
     * Merge the given fillable attributes with the existing fillable attributes.
     *
     * @param array $fillable
     * @return $this
     */
    public function merge_fillable(array $fillable)
    {
        $this->fillable = array_values(
            array_unique(
                array_merge($this->fillable, $fillable)
            )
        );

        return $this;
    }

    /**
     * Get the guarded attributes for the model.
     *
     * @return array
     */
    public function get_guarded()
    {
        return static::$unguarded ? [] : $this->guarded;
    }

    /**
     * Set the guarded attributes for the model.
     *
     * @param array $guarded
     * @return $this
     */
    public function guard(array $guarded)
    {
        $this->guarded = $guarded;

        return $this;
    }

    /**
     * Merge the given guarded attributes with the existing guarded attributes.
     *
     * @param array $guarded
     * @return $this
     */
    public function merge_guarded(array $guarded)
    {
        $this->guarded = array_values(
            array_unique(
                array_merge($this->guarded, $guarded)
            )
        );

        return $this;
    }

    /**
     * Enable mass assignment for all attributes.
     *
     * @param bool $state
     * @return void
     */
    public static function unguard($state = true)
    {
        static::$unguarded = $state;
    }

    /**
     * Disable mass assignment for all attributes.
     *
     * @return void
     */
    public static function reguard()
    {
        static::$unguarded = false;
    }

    /**
     * Determine if mass assignment is enabled for all attributes.
     *
     * @return bool
     */
    public static function is_unguarded()
    {
        return static::$unguarded;
    }

    /**
     * Execute the given callback while mass assignment is enabled for all attributes.
     *
     * @param callable $callback
     * @return mixed
     */
    public static function unguarded(callable $callback)
    {
        if (static::$unguarded) {
            return $callback();
        }

        static::unguard();

        try {
            return $callback();
        } finally {
            static::reguard();
        }
    }

    /**
     * Determine if the given key is fillable.
     *
     * @param string $key
     * @return bool
     */
    public function is_fillable($key)
    {
        if (static::$unguarded) {
            return true;
        }

        if (in_array($key, $this->get_fillable(), true)) {
            return true;
        }

        if ($this->is_guarded($key)) {
            return false;
        }

        return empty($this->get_fillable()) && !str_contains($key, '.') && !str_contains($key, '_');
    }

    /**
     * Determine if the given key is guarded.
     *
     * @param string $key
     * @return bool
     */
    public function is_guarded($key)
    {
        if (empty($this->get_guarded())) {
            return false;
        }

        return $this->get_guarded() === ['*'] ||
            empty(preg_grep('/^' . preg_quote($key, '/') . '$/i', $this->get_guarded()));
    }
}
