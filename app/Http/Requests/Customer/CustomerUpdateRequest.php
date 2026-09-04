<?php

namespace Kirki\Ecommerce\App\Http\Requests\Customer;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class CustomerUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'id' => 'required|integer',
            'first_name' => 'required|string',
            'last_name' => 'string|nullable',
            'photo' => 'integer|nullable',
            'email' => 'required|email',
            'phone' => 'string|nullable',
            'accepts_marketing' => 'boolean|nullable',
            'notes' => 'string|nullable',
            'language' => 'string|nullable',
            'tags' => 'array|nullable',
            'tags.*' => 'string',
            'shipping_address' => 'required|array',
            'shipping_address.first_name' => 'required|string',
            'shipping_address.last_name' => 'nullable|string',
            'shipping_address.email' => 'required|string',
            'shipping_address.phone' => 'required|string',
            'shipping_address.address_line1' => 'required|string',
            'shipping_address.address_line2' => 'nullable|string',
            'shipping_address.city' => 'required|string',
            'shipping_address.state' => 'required|string',
            'shipping_address.postal_code' => 'required|string',
            'shipping_address.country' => 'required|string',
            'billing_address' => 'required|array',
            'billing_address.first_name' => 'required|string',
            'billing_address.last_name' => 'nullable|string',
            'billing_address.email' => 'required|string',
            'billing_address.phone' => 'required|string',
            'billing_address.address_line1' => 'required|string',
            'billing_address.address_line2' => 'nullable|string',
            'billing_address.city' => 'required|string',
            'billing_address.state' => 'required|string',
            'billing_address.postal_code' => 'required|string',
            'billing_address.country' => 'required|string',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'first_name' => Sanitizer::TEXT,
            'last_name' => Sanitizer::TEXT,
            'photo' => Sanitizer::INT,
            'email' => Sanitizer::TEXT,
            'phone' => Sanitizer::TEXT,
            'accepts_marketing' => Sanitizer::BOOL,
            'notes' => Sanitizer::TEXT,
            'tags' => Sanitizer::ARRAY,
            'language' => Sanitizer::TEXT,
            'tags.*' => Sanitizer::TEXT,
            'billing_address' => Sanitizer::ARRAY,
            'billing_address.first_name' => Sanitizer::TEXT,
            'billing_address.last_name' => Sanitizer::TEXT,
            'billing_address.email' => Sanitizer::TEXT,
            'billing_address.phone' => Sanitizer::TEXT,
            'billing_address.address_line1' => Sanitizer::TEXT,
            'billing_address.address_line2' => Sanitizer::TEXT,
            'billing_address.city' => Sanitizer::TEXT,
            'billing_address.state' => Sanitizer::TEXT,
            'billing_address.postal_code' => Sanitizer::TEXT,
            'billing_address.country' => Sanitizer::TEXT,
            'shipping_address' => Sanitizer::ARRAY,
            'shipping_address.first_name' => Sanitizer::TEXT,
            'shipping_address.last_name' => Sanitizer::TEXT,
            'shipping_address.email' => Sanitizer::TEXT,
            'shipping_address.phone' => Sanitizer::TEXT,
            'shipping_address.address_line1' => Sanitizer::TEXT,
            'shipping_address.address_line2' => Sanitizer::TEXT,
            'shipping_address.city' => Sanitizer::TEXT,
            'shipping_address.state' => Sanitizer::TEXT,
            'shipping_address.postal_code' => Sanitizer::TEXT,
            'shipping_address.country' => Sanitizer::TEXT,
        ];
    }
}
