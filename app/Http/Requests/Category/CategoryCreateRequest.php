<?php

namespace Kirki\Ecommerce\App\Http\Requests\Category;

use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class CategoryCreateRequest extends Request
{
    public function rules()
    {
        return [
            'parent_id' => 'integer|nullable',
            'name' => 'required|string',
            'slug' => 'string|nullable|unique:' . Category::get_table_name() . ',slug',
            'description' => 'string|nullable',
            'image' => 'integer|nullable',
            'level' => 'integer|nullable',
            'ordering' => 'integer|nullable',
            'is_active' => 'nullable|boolean',
            'is_deletable' => 'nullable|boolean',
        ];
    }

    public function filters()
    {
        return [
            'parent_id' => Sanitizer::INT,
            'name' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
            'image' => Sanitizer::INT,
            'level' => Sanitizer::INT,
            'ordering' => Sanitizer::INT,
            'is_active' => Sanitizer::BOOL,
            'is_deletable' => Sanitizer::BOOL,
        ];
    }
}
