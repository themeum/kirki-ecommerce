<?php

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class AddressUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'type' => 'required|string|in:' . implode(',', [AddressType::HOME, AddressType::OFFICE, AddressType::OTHERS]),
            'first_name' => 'required|string',
            'last_name' => 'nullable|string',
            'email' => 'nullable|string',
            'phone' => 'nullable|string',
            'address_line1' => 'required|string',
            'address_line2' => 'nullable|string',
            'city' => 'required|string',
            'state' => 'required|string',
            'postal_code' => 'required|string',
            'country' => 'required|string',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'type' => Sanitizer::TEXT,
            'first_name' => Sanitizer::TEXT,
            'last_name' => Sanitizer::TEXT,
            'email' => Sanitizer::TEXT,
            'phone' => Sanitizer::TEXT,
            'address_line1' => Sanitizer::TEXT,
            'address_line2' => Sanitizer::TEXT,
            'city' => Sanitizer::TEXT,
            'state' => Sanitizer::TEXT,
            'postal_code' => Sanitizer::TEXT,
            'country' => Sanitizer::TEXT,
        ];
    }
}
