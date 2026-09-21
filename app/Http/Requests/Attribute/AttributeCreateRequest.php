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
        ];
    }
}
