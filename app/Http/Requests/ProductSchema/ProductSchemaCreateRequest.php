<?php

namespace Kirki\Ecommerce\App\Http\Requests\ProductSchema;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

class ProductSchemaCreateRequest extends Request
{
    public function rules()
    {
        return [
            'name' => 'required|string|max:500',
            'is_default' => 'boolean',
            'schema' => 'nullable|array',
        ];
    }

    public function filters()
    {
        return [
            'name' => Sanitizer::TRIM,
            'is_default' => Sanitizer::BOOL,
            'schema' => Sanitizer::ARRAY,
        ];
    }
}
