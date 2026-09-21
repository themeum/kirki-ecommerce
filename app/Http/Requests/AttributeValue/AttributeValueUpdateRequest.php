<?php

namespace Kirki\Ecommerce\App\Http\Requests\AttributeValue;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for updating an attribute value.
 *
 * @since 1.0.0
 */
class AttributeValueUpdateRequest extends Request
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
            'value' => 'string|nullable',
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
            'id' => Sanitizer::INT,
            'value' => Sanitizer::TEXT,
            'color' => Sanitizer::TEXT,
            'media' => Sanitizer::INT,
        ];
    }
}
