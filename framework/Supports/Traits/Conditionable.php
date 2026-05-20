<?php

namespace Kirki\Ecommerce\Supports\Traits;

use Closure;

trait Conditionable
{
    /**
     * Execute the callback when the value is true
     *
     * @param mixed $value The value to check
     * @param callable $callback The callback to execute if the value is true
     * @param mixed $default The default value to return if the value is true
     *
     * @return mixed The result of the callback or the default value
     * 
     * @since 1.0.0
     */
    public function when($value, callable $callback, $default = null)
    {
        $value = $value instanceof Closure ? $value($this) : $value;

        if ($value) {
            return $callback($this, $value);
        } elseif ($default) {
            return $default instanceof Closure ? $default($this, $value) : $default;
        }

        return $this;
    }

    /**
     * Execute the callback unless the value is true
     *
     * @param mixed $value The value to check
     * @param callable $callback The callback to execute if the value is false
     * @param mixed $default The default value to return if the value is false
     *
     * @return mixed The result of the callback or the default value
     * 
     * @since 1.0.0
     */
    public function unless($value, callable $callback, $default = null)
    {
        $value = $value instanceof Closure ? $value($this) : $value;

        if (!$value) {
            return $callback($this, $value);
        } elseif ($default) {
            return $default instanceof Closure ? $default($this, $value) : $default;
        }

        return $this;
    }
}
