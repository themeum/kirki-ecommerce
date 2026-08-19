<?php

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class LoginRequest extends Request
{
    public function rules()
    {
        return [
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'nullable|in:on,off',
        ];
    }

    public function filters()
    {
        return [
            'email' => Sanitizer::EMAIL,
            'password' => Sanitizer::TEXT,
            'remember' => fn($value) => 'on' === $value,
        ];
    }
}
