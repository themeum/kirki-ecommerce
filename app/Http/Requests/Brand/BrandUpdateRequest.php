<?php

namespace Kirki\Ecommerce\App\Http\Requests\Brand;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class BrandUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'name' => 'required|string',
            'slug' => 'string|nullable',
            'description' => 'string|nullable',
            'logo' => 'integer|nullable',
            'website_url' => 'string|nullable',
            'is_active' => 'boolean|nullable',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'name' => Sanitizer::TEXT,
            'slug' => Sanitizer::TEXT,
            'description' => Sanitizer::TEXT,
            'logo' => Sanitizer::INT,
            'website_url' => Sanitizer::TEXT,
            'is_active' => Sanitizer::BOOL,
        ];
    }
}
