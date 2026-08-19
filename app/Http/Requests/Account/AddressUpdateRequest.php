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

        return [
            'first_name' => 'required_if:is_billing_same_as_shipping,0|nullable|string',
            'last_name' => 'nullable|string',
            'email' => 'required_if:is_billing_same_as_shipping,0|nullable|string',
            'phone' => 'required_if:is_billing_same_as_shipping,0|nullable|string',
            'address_line1' => 'required_if:is_billing_same_as_shipping,0|nullable|string',
            'address_line2' => 'nullable|string',
            'city' => 'required_if:is_billing_same_as_shipping,0|nullable|string',
            'state' => 'required_if:is_billing_same_as_shipping,0|nullable|string',
            'postal_code' => 'required_if:is_billing_same_as_shipping,0|nullable|string',
            'country' => 'required_if:is_billing_same_as_shipping,0|nullable|string',
            'type' => 'required|string|in:' . implode(',', [AddressType::SHIPPING, AddressType::BILLING]),
            'is_billing_same_as_shipping' => 'required_if:type,' . AddressType::BILLING . '|nullable|boolean',
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
