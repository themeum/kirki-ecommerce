<?php

namespace Kirki\Ecommerce\App\Http\Requests\Tag;

use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class TagUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'name' => 'required|string',
            'slug' => 'string|nullable|unique:' . Tag::get_table_name() . ',slug,' . $this->get_int('id'),
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
