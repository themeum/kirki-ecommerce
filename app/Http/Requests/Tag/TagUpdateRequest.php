<?php

namespace Kirki\Ecommerce\App\Http\Requests\Tag;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class TagUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'name' => 'required|string',
            'slug' => 'string|nullable',
            'description' => 'string|nullable',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'name' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
        ];
    }
}
