<?php

namespace Kirki\Ecommerce\App\Http\Requests\Variant;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class GenerateSkusRequest extends Request
{
    public function rules()
    {
        return [
            'variant_ids' => 'required|array|min:1',
            'variant_ids.*' => 'integer',
        ];
    }

    public function filters()
    {
        return [
            'variant_ids' => Sanitizer::ARRAY,
            'variant_ids.*' => Sanitizer::INT,
        ];
    }
}
