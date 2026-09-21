<?php

namespace Kirki\Ecommerce\App\Http\Requests\ProductSchema;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the payload for creating a product schema.
 *
 * @since 1.0.0
 */
class ProductSchemaCreateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'name' => 'required|string|max:500',
            'is_default' => 'boolean',
            'schema' => 'nullable|array',
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
            'name' => Sanitizer::TRIM,
            'is_default' => Sanitizer::BOOL,
            'schema' => Sanitizer::ARRAY,
        ];
    }
}
