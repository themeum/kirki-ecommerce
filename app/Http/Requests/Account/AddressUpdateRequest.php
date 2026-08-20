<?php

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Validation\Rule;

class AddressUpdateRequest extends Request
{
    public function rules()
    {
        $address_field = Rule::when(
            fn($data) => ($data['type'] ?? null) !== AddressType::BILLING || empty($data['is_billing_same_as_shipping']),
            ['required', 'string'],
            ['nullable', 'string']
        );

        $is_billing_same_as_shipping_field = Rule::when(
            fn($data) => ($data['type'] ?? null) === AddressType::BILLING,
            ['required', 'boolean'],
            ['nullable', 'boolean']
        );

        return [
            'type' => 'required|string|in:' . implode(',', [AddressType::SHIPPING, AddressType::BILLING]),
            'is_billing_same_as_shipping' => $is_billing_same_as_shipping_field,
            'first_name' => $address_field,
            'last_name' => 'nullable|string',
            'email' => $address_field,
            'phone' => $address_field,
            'address_line1' => $address_field,
            'address_line2' => 'nullable|string',
            'city' => $address_field,
            'state' => $address_field,
            'postal_code' => $address_field,
            'country' => $address_field,
        ];
    }

    public function filters()
    {
        return [
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
            'type' => Sanitizer::TEXT,
            'is_billing_same_as_shipping' => Sanitizer::BOOL,
        ];
    }
}
