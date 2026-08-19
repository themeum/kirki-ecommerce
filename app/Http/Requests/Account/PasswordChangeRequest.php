<?php

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\App\Constants\Password;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class PasswordChangeRequest extends Request
{
    public function rules()
    {
        return [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:' . Password::MIN_LENGTH,
            'new_password_confirmation' => 'required|same_as:new_password',
        ];
    }

    public function filters()
    {
        // Sanitizer::TEXT runs sanitize_text_field(), which strips tags and
        // trims/collapses whitespace — that would silently mutate a
        // legitimate password before it's checked/hashed. Pass through as-is.
        return [
            'current_password' => Sanitizer::ANY,
            'new_password' => Sanitizer::ANY,
            'new_password_confirmation' => Sanitizer::ANY,
        ];
    }
}
