<?php

namespace Kirki\Ecommerce\Concerns;

trait DeepGettable
{
    /**
     * Return the nested setting values by key recursively.
     *
     * @param array $settings
     * @param string|array $keys
     * @param mixed $default
     *
     * @return mixed|null
     */
    protected function deep_get(array $settings, $keys, $default = null)
    {
        $keys = is_array($keys) ? $keys : explode('.', $keys);

        if (empty($keys) || empty($settings)) {
            return $default;
        }

        $parent_key = $keys[0];
        $child_keys = array_slice($keys, 1);

        if (empty($child_keys)) {
            return $settings[$parent_key] ?? $default;
        }

        if (empty($settings[$parent_key])) {
            return $default;
        }

        return $this->deep_get($settings[$parent_key], $child_keys, $default);
    }
}
