<?php

namespace Kirki\Ecommerce\App\Http\Requests\Attribute;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for creating a product attribute.
 *
 * @since 1.0.0
 */
class AttributeCreateRequest extends Request
{
    public const HEX_COLOR_PATTERN = '/^#(?:[0-9a-fA-F]{3}){1,2}$/';

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'name' => 'required|string|unique:' . Attribute::get_table_name() . ',name',
            'slug' => 'string|nullable|unique:' . Attribute::get_table_name() . ',slug',
            'type' => 'string|in:color,list|nullable',
            'values' => ['array', 'nullable', function ($values) {
                return static::has_duplicate_value_names($values)
                    ? __('Each value name must be unique.', 'kirki-ecommerce')
                    : true;
            }],
            'values.*.value' => 'required|string',
            'values.*.color' => 'string|nullable|regex:' . static::HEX_COLOR_PATTERN,
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return [
            'name' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'type' => Sanitizer::TEXT,
            'values.*.value' => Sanitizer::TEXT,
            'values.*.color' => Sanitizer::TEXT,
        ];
    }

    /**
     * Determine whether a list of value rows repeats a name, ignoring case and surrounding whitespace.
     *
     * @since 1.0.0
     *
     * @param mixed $values List of `['value' => string]` rows.
     * @return bool
     */
    public static function has_duplicate_value_names($values)
    {
        if (!is_array($values)) {
            return false;
        }

        $names = array_map(function ($row) {
            return strtolower(trim((string) ($row['value'] ?? '')));
        }, $values);

        return count($names) !== count(array_unique($names));
    }
}
