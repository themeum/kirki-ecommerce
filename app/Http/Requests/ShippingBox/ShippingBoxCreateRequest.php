<?php

namespace Kirki\Ecommerce\App\Http\Requests\ShippingBox;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for creating a shipping box.
 *
 * @since 1.0.0
 */
class ShippingBoxCreateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'name' => 'required|string',
            'description' => 'nullable|string',
            'width' => 'required|float|gt:0',
            'height' => 'required|float|gt:0',
            'length' => 'required|float|gt:0',
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
