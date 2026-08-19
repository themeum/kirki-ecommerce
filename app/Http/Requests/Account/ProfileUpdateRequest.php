<?php

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class ProfileUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'first_name' => 'required|string',
            'last_name' => 'nullable|string',
            'phone' => 'nullable|string',
            'display_name' => 'required|string',
        ];
    }

    public function filters()
    {
        return [
            'first_name' => Sanitizer::TEXT,
            'last_name' => Sanitizer::TEXT,
            'phone' => Sanitizer::TEXT,
            'display_name' => Sanitizer::TEXT,
        ];
    }
}
