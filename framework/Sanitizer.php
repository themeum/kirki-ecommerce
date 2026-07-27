<?php

namespace Kirki\Ecommerce;

use Kirki\Ecommerce\Supports\Facades\Date;
use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\is_valid_json;

/**
 * Class Sanitizer.
 * 
 * @since 1.0.0
 */

class Sanitizer
{
    /**
     * Trim the value.
     *
     * @var string
     */
    const ANY = 'any';

    /**
     * Trim the value.
     *
     * @var string
     */
    const TRIM = 'trim';

    /**
     * Sanitize the value as text.
     *
     * @var string
     */
    const TEXT = 'text';

    /**
     * Sanitize the rich text content.
     *
     * @var string
     */
    const RICH_TEXT = 'rich-text';

    /**
     * Sanitize the value as textarea.
     *
     * @var string
     */
    const TEXTAREA = 'textarea';

    /**
     * Sanitize the value as email.
     *
     * @var string
     */
    const EMAIL = 'email';

    /**
     * Sanitize the value as username.
     *
     * @var string
     */
    const USERNAME = 'username';

    /**
     * Sanitize the value as url.
     *
     * @var string
     */
    const URL = 'url';

    /**
     * Sanitize the value as key.
     *
     * @var string
     */
    const KEY = 'key';

    /**
     * Sanitize the value as title.
     *
     * @var string
     */
    const TITLE = 'title';

    /**
     * Sanitize the value as file name.
     *
     * @var string
     */
    const FILE_NAME = 'file-name';

    /**
     * Sanitize the value as mime type.
     *
     * @var string
     */
    const MIME_TYPE = 'mime-type';

    /**
     * Sanitize the value as int.
     *
     * @var string
     */
    const INT = 'int';

    /**
     * Sanitize the value as int.
     *
     * @var string
     */
    const FLOAT = 'float';

    /**
     * Sanitize the value as double.
     *
     * @var string
     */
    const DOUBLE = 'double';

    /**
     * Sanitize the value as money prepared for storage.
     *
     * @var string
     */
    const MONEY = 'money';

    /**
     * Sanitize the value as boolean.
     *
     * @var string
     */
    const BOOL = 'bool';

    /**
     * Sanitize the value as array.
     *
     * @var string
     */
    const ARRAY = 'array';

    /**
     * Sanitize the value as date.
     *
     * @var string
     */
    const DATE = 'date';

    /**
     * Sanitize the value as datetime.
     *
     * @var string
     */
    const DATETIME = 'datetime';

    /**
     * Input data.
     * 
     * @var array<key:int,value:mixed>
     */
    protected $data;

    /**
     * Sanitized data.
     * 
     * @var array<key:int,value:mixed>
     */
    protected $sanitized_data = [];

    /**
     * Sanitization rules.
     * 
     * @var array<key:int,value:mixed>
     */
    protected $rules;

    /**
     * Create a new Sanitizer instance.
     * 
     * @param array $data
     * @param array $rules
     */
    public function __construct(array $data = [], array $rules = [])
    {
        $this->data = $data;
        $this->rules = $rules;

        $this->run_sanitizer();
    }

    /**
     * Get the sanitized data.
     * 
     * @return array
     */
    public function get_sanitized_data()
    {
        return $this->sanitized_data;
    }

    /**
     * Sanitize the data.
     *
     * @param array $data
     * @param array $rules
     * 
     * @return static
     */
    public static function make(array $data = [], array $rules = [])
    {
        return new static($data, $rules);
    }

    /**
     * Run sanitizer
     * @return void
     */
    protected function run_sanitizer()
    {
        foreach ($this->rules as $key => $rule) {
            $key_segments = explode('.', $key);
            $this->traverse_and_sanitize($this->data, $key_segments, [], $rule);
        }
    }

    /**
     * Recursively traverses the input data structure according to a dot-notated rule key,
     * handling wildcard segments (e.g., *) to apply sanitization rules at dynamic levels.
     *
     * @param mixed $current_data               The current level of data being inspected. This is a portion
     *                                          of the original data array.
     *
     * @param array $key_segments               The remaining parts (split by '.') of the rule key that
     *                                          still need to be resolved. e.g. 'items.*.id' would be  ['items', '*', 'id']
     *
     * @param array $traversed_path_stack       The stack of key_segments already traversed so far. This is used
     *                                          to reconstruct the current dot-notated key (e.g., 'items.0.id')
     *                                          for both error messages and setting validated values.
     *
     * @param string $rule                      A sanitization rule to apply on the current data.
     * 
     * @return void
     */
    protected function traverse_and_sanitize($current_data, $key_segments, $traversed_path_stack, $rule)
    {
        // when all segments have been traversed
        if (empty($key_segments)) {
            $this->set_sanitized_data($traversed_path_stack, static::apply_rule($current_data, $rule, $this->data));
            return;
        }

        $segment = array_shift($key_segments);
        if ($segment === '*') {
            if (!is_array($current_data)) {
                $this->set_sanitized_data($traversed_path_stack, static::apply_rule($current_data, static::ARRAY, $this->data));
                return;
            }

            foreach ($current_data as $index => $item) {
                $this->traverse_and_sanitize(
                    $item,
                    $key_segments,
                    array_merge($traversed_path_stack, [$index]),
                    $rule
                );
            }
        } elseif (is_array($current_data) && array_key_exists($segment, $current_data)) {
            $this->traverse_and_sanitize(
                $current_data[$segment],
                $key_segments,
                array_merge($traversed_path_stack, [$segment]),
                $rule
            );
        }
    }

    /**
     * Set the sanitized data using a series of keys to traverse the nested array structure.
     *
     * @param array $keys An array of keys representing the path in the nested array structure.
     * @param mixed $value The value to set at the specified path in the sanitized data array.
     *
     * @return void
     */
    protected function set_sanitized_data($keys, $value)
    {
        $ref = &$this->sanitized_data;

        foreach ($keys as $key) {
            if (!isset($ref[$key])) {
                $ref[$key] = [];
            }
            $ref = &$ref[$key];
        }

        $ref = $value;
    }

    /**
     * Apply sanitization.
     * 
     * @param mixed $value
     * @param string|callable|null $type
     * @param array $data
     * @return mixed
     */
    public static function apply_rule($value, $type, array $data = [])
    {
        // For the null values, we don't need to sanitize them.
        if (is_null($value)) {
            return null;
        }

        if ($type === null) {
            return $value;
        }

        switch ($type) {
            case static::ANY:
                return $value;
            case static::TRIM:
                $value = trim($value);
                break;
            case static::TEXT:
                $value = sanitize_text_field($value);
                break;
            case static::RICH_TEXT:
                $value = wp_kses_post($value);
                break;
            case static::TEXTAREA:
                $value = sanitize_textarea_field($value);
                break;
            case static::EMAIL:
                $value = sanitize_email($value);
                break;
            case static::USERNAME:
                $value = sanitize_user($value);
                break;
            case static::URL:
                $value = sanitize_url($value);
                break;
            case static::KEY:
                $value = sanitize_key($value);
                break;
            case static::TITLE:
                $value = sanitize_title($value);
                break;
            case static::FILE_NAME:
                $value = sanitize_file_name($value);
                break;
            case static::MIME_TYPE:
                $value = sanitize_mime_type($value);
                break;
            case static::INT:
                $value = (int) $value;
                break;
            case static::FLOAT:
            case static::DOUBLE:
                $value = (float) $value;
                break;
            case static::MONEY:
                $value = Money::to_minor($value);
                break;
            case static::BOOL:
                $value = (bool) $value;
                break;
            case static::ARRAY:
                if (is_array($value)) {
                    break;
                }

                if (empty($value)) {
                    $value = [];
                    break;
                }

                if (is_valid_json($value)) {
                    $value = json_decode($value, true);
                    break;
                }

                if (is_serialized($value)) {
                    $value = maybe_unserialize($value);
                    break;
                }

                // For anything else (int, bool, object, etc.) cast to array directly
                $value = [$value];
                break;
            case static::DATE:
                if (!Date::is_valid_date($value)) {
                    return null;
                }

                $value = Date::parse($value)->startOfDay();
                break;
            case static::DATETIME:
                if (!Date::is_valid_date($value)) {
                    return null;
                }

                $value = Date::parse($value);
                break;
            default:
                if (is_callable($type)) {
                    $value = $type($value, $data);
                }
                break;
        }

        return $value;
    }
}
