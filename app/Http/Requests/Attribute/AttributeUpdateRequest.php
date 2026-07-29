<?php

namespace Kirki\Ecommerce\App\Http\Requests\Attribute;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class AttributeUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'name' => 'required|string',
            'slug' => 'string|nullable',
            'type' => 'string|in:color,list|nullable',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'name' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'type' => Sanitizer::TEXT,
        ];
    }
}
