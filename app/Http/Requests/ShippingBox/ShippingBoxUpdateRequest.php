<?php

namespace Kirki\Ecommerce\App\Http\Requests\ShippingBox;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for updating a shipping box.
 *
 * @since 1.0.0
 */
class ShippingBoxUpdateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'width' => 'required|float',
            'height' => 'required|float',
            'length' => 'required|float',
            'unit' => 'required|string',
            'is_default' => 'nullable|boolean',
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
            'name' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
            'width' => Sanitizer::FLOAT,
            'height' => Sanitizer::FLOAT,
            'length' => Sanitizer::FLOAT,
            'unit' => Sanitizer::TEXT,
            'is_default' => Sanitizer::BOOL,
        ];
    }
}
