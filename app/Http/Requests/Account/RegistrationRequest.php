<?php

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class RegistrationRequest extends Request
{
    public function rules()
    {
        return [
            'first_name' => 'required',
            'last_name' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8',
            'password_confirmation' => 'required|same_as:password',
        ];
    }

    public function filters()
    {
        return [
            'first_name' => Sanitizer::TEXT,
            'last_name' => Sanitizer::TEXT,
            'email' => Sanitizer::EMAIL,
            'password' => Sanitizer::TEXT,
            'password_confirmation' => Sanitizer::TEXT,
        ];
    }
}
