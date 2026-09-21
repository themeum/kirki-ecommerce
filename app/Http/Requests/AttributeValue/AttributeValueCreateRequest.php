<?php

namespace Kirki\Ecommerce\App\Http\Requests\AttributeValue;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for creating an attribute value.
 *
 * @since 1.0.0
 */
class AttributeValueCreateRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'attribute_id' => 'required|integer',
            'value' => 'required|string',
            'color' => 'string|nullable',
            'media' => 'integer|nullable',
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
            'attribute_id' => Sanitizer::INT,
            'value' => Sanitizer::TEXT,
            'color' => Sanitizer::TEXT,
            'media' => Sanitizer::INT,
        ];
    }
}
