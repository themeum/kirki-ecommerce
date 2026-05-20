<?php

namespace Kirki\Ecommerce\App\Http\Requests\Cart;

use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Http\Request;

class CartUpdateRequest extends Request
{
    public function rules()
    {
        return [
            'shipping_address' => 'array',
            'shipping_address.first_name' => 'string',
            'shipping_address.last_name' => 'string|nullable',
            'shipping_address.email' => 'email',
            'shipping_address.phone' => 'string',
            'shipping_address.address_line1' => 'string',
            'shipping_address.address_line2' => 'string|nullable',
            'shipping_address.city' => 'string',
            'shipping_address.state' => 'string',
            'shipping_address.postal_code' => 'string',
            'shipping_address.country' => 'string',
            'shipping_address.company' => 'string|nullable',

            'billing_address' => 'array',
            'billing_address.first_name' => 'string',
            'billing_address.last_name' => 'string|nullable',
            'billing_address.email' => 'email',
            'billing_address.phone' => 'string',
            'billing_address.address_line1' => 'string',
            'billing_address.address_line2' => 'string|nullable',
            'billing_address.city' => 'string',
            'billing_address.state' => 'string',
            'billing_address.postal_code' => 'string',
            'billing_address.country' => 'string',
            'billing_address.company' => 'string|nullable',

            'shipping_method' => 'string|nullable',
            'coupon_code' => 'string|nullable',
            'customer_notes' => 'string|nullable',
        ];
    }

    public function filters()
    {
        return [
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
            'shipping_address.company' => Sanitizer::TEXT,

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
            'billing_address.company' => Sanitizer::TEXT,

            'shipping_method' => Sanitizer::TEXT,
            'coupon_code' => Sanitizer::TEXT,
            'customer_notes' => Sanitizer::TEXT,
        ];
    }
}
