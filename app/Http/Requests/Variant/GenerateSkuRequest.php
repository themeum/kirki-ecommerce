<?php

namespace Kirki\Ecommerce\App\Http\Requests\Variant;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class GenerateSkuRequest extends Request
{
    public function rules()
    {
        return [
            'variant_id' => 'nullable|integer',
            'title' => 'nullable|string|max:255',
            'brand_id' => 'nullable|integer',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer',
            'attribute_value_ids' => 'nullable|array',
            'attribute_value_ids.*' => 'integer',
        ];
    }

    public function filters()
    {
        return [
            'variant_id' => Sanitizer::INT,
            'title' => Sanitizer::TEXT,
            'brand_id' => Sanitizer::INT,
            'category_ids' => Sanitizer::ARRAY,
            'category_ids.*' => Sanitizer::INT,
            'attribute_value_ids' => Sanitizer::ARRAY,
            'attribute_value_ids.*' => Sanitizer::INT,
        ];
    }
}
