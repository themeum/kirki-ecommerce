<?php

namespace Kirki\Ecommerce\App\Http\Requests;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class TagRequest extends Request
{
    public function rules()
    {
        return [
            'search' => 'required|string|max:255',
            'sort_by' => 'required|string|max:255',
        ];
    }

    public function filters()
    {
        return [
            'search' => Sanitizer::TEXT,
            'sort_by' => Sanitizer::TEXT,
            'sort_order' => Sanitizer::TEXT,
        ];
    }
}
