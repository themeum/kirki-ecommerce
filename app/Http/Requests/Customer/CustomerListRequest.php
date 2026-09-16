<?php

namespace Kirki\Ecommerce\App\Http\Requests\Customer;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class CustomerListRequest extends Request
{
    public function rules()
    {
        return [
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
        ];
    }

    public function filters()
    {
        return [
            'country' => Sanitizer::TEXT,
            'city' => Sanitizer::TEXT,
        ];
    }
}
