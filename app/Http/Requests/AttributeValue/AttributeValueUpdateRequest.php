<?php

namespace Kirki\Ecommerce\App\Http\Requests\AttributeValue;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class AttributeValueUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'value' => 'string|nullable',
            'color' => 'string|nullable',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'value' => Sanitizer::TEXT,
            'color' => Sanitizer::TEXT,
        ];
    }
}
