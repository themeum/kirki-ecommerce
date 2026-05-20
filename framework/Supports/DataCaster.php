<?php

namespace Kirki\Ecommerce\Supports;

use Exception;

/**
 * Class DataCaster
 *
 * Provides static utility methods to cast values and data structures
 * to specific types (e.g., integer, float, boolean, string, array).
 */
class DataCaster
{
    /**
     * Cast a value to the given type.
     *
     * @param mixed $value
     * @param string|null $type
     * @return mixed
     */
    public static function cast_value($value, $type = null)
    {
        if (is_null($type)) {
            return $value;
        }

        switch (strtolower($type)) {
            case 'int':
            case 'integer':
                return (int) $value;

            case 'float':
            case 'double':
                return (float) $value;

            case 'bool':
            case 'boolean':
                return (bool) $value;

            case 'string':
                return (string) $value;

            case 'array':
                if (is_array($value)) {
                    return $value;
                }

                if (is_string($value)) {
                    $decoded = json_decode($value, true);

                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        return $decoded;
                    }

                    return [$value];
                }

                // For anything else (int, bool, object, etc.) cast to array directly
                return [$value];

            default:
                return $value;
        }
    }

    /**
     * Cast an array or object using a type map.
     *
     * @param array|object $data
     * @param array $map
     * @return array
     * @throws Exception
     */
    public static function cast_data($data, $map)
    {
        if (!is_array($data) && !is_object($data)) {
            throw new Exception(__('Data must be either an array or an object', 'kirki-ecommerce'));
        }

        if (is_object($data)) {
            foreach ($map as $key => $type) {
                $data->{$key} = static::cast_value($data->{$key}, $type);
            }
        }

        if (is_array($data)) {
            foreach ($map as $key => $type) {
                $data[$key] = static::cast_value($data[$key], $type);
            }
        }

        return $data;
    }
}
