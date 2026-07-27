<?php

namespace Kirki\Ecommerce\App\Http\Requests\AttributeValue;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class AttributeValueCreateRequest extends Request
{
    public function rules()
    {
        return [
            'attribute_id' => 'required|integer',
            'value' => 'required|string',
            'color' => 'string|nullable',
        ];
    }

    public function filters()
    {
        return [
            'attribute_id' => Sanitizer::INT,
            'value' => Sanitizer::TEXT,
            'color' => Sanitizer::TEXT,
        ];
    }
}
