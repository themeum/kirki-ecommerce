<?php

namespace Kirki\Ecommerce\App\Http\Requests\ShippingBox;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class ShippingBoxUpdateRequest extends Request
{
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
