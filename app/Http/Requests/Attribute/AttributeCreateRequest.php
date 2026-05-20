<?php

namespace Kirki\Ecommerce\App\Http\Requests\Attribute;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class AttributeCreateRequest extends Request
{
    public function rules()
    {
        return [
            'name' => 'required|string|unique:' . Attribute::get_table_name() . ',name',
            'slug' => 'string|nullable|unique:' . Attribute::get_table_name() . ',slug',
            'type' => 'string|in:color,list|nullable',
        ];
    }

    public function filters()
    {
        return [
            'name' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'type' => Sanitizer::TEXT,
        ];
    }
}
