<?php

namespace Kirki\Ecommerce\App\Http\Requests\Tag;

use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class TagCreateRequest extends Request
{
    public function rules()
    {
        return [
            'name' => 'required|string',
            'slug' => 'string|nullable|unique:' . Tag::get_table() . ',slug',
            'description' => 'string|nullable',
        ];
    }

    public function filters()
    {
        return [
            'name' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
        ];
    }
}
