<?php

namespace Kirki\Ecommerce\App\Http\Requests\ShippingBox;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class ShippingBoxCreateRequest extends Request
{
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
