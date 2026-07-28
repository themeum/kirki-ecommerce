<?php

namespace Kirki\Ecommerce\App\Http\Requests\Collection;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class CollectionUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'title' => 'required|string',
            'slug' => 'string|nullable',
            'description' => 'string|nullable',
            'banner' => 'integer|nullable',
            'seo_title' => 'string|nullable',
            'seo_description' => 'string|nullable',
            'seo_keywords' => 'string|nullable',
            'is_active' => 'boolean|nullable',
            'ordering' => 'integer|nullable',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'title' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
            'banner' => Sanitizer::INT,
            'seo_title' => Sanitizer::TEXT,
            'seo_description' => Sanitizer::TEXT,
            'seo_keywords' => Sanitizer::TEXT,
            'is_active' => Sanitizer::BOOL,
            'ordering' => Sanitizer::INT,
        ];
    }
}
