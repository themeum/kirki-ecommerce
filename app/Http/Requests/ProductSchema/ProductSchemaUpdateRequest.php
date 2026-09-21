<?php

namespace Kirki\Ecommerce\App\Http\Requests\ProductSchema;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for updating a product schema.
 *
 * @since 1.0.0
 */
class ProductSchemaUpdateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'id' => 'required|exists:kirki_ecommerce_product_schemas,id',
            'name' => 'string|max:500',
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
            'id' => Sanitizer::INT,
            'name' => Sanitizer::TRIM,
            'is_default' => Sanitizer::BOOL,
            'schema' => Sanitizer::ARRAY,
        ];
    }
}
