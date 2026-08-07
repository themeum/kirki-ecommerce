<?php

namespace Kirki\Ecommerce\App\Http\Requests\Cart;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class CartUpdateRequest extends Request
{
    public function prepare_for_validation()
    {
        if($this->input('is_billing_same_as_shipping')){
            $this->merge([
                'billing_address' => $this->input('shipping_address')
            ]);
        }
    }

    public function rules()
    {
        return [
            'shipping_address' => 'array|nullable',
            'shipping_address.first_name' => 'string|nullable',
            'shipping_address.last_name' => 'string|nullable',
            'shipping_address.email' => 'email|nullable',
            'shipping_address.phone' => 'string|nullable',
            'shipping_address.address_line1' => 'string|nullable',
            'shipping_address.address_line2' => 'string|nullable',
            'shipping_address.city' => 'string|nullable',
            'shipping_address.state' => 'string|nullable',
            'shipping_address.postal_code' => 'string|nullable',
            'shipping_address.country' => 'string|nullable',
            'shipping_address.company' => 'string|nullable',

            'is_billing_same_as_shipping' => 'boolean|nullable',

            'billing_address' => 'array|nullable',
            'billing_address.first_name' => 'string|nullable',
            'billing_address.last_name' => 'string|nullable',
            'billing_address.email' => 'email|nullable',
            'billing_address.phone' => 'string|nullable',
            'billing_address.address_line1' => 'string|nullable',
            'billing_address.address_line2' => 'string|nullable',
            'billing_address.city' => 'string|nullable',
            'billing_address.state' => 'string|nullable',
            'billing_address.postal_code' => 'string|nullable',
            'billing_address.country' => 'string|nullable',
            'billing_address.company' => 'string|nullable',

            'shipping_method' => 'string|nullable',
            'coupon_code' => 'string|nullable',
            'customer_notes' => 'string|nullable',
            'admin_notes' => 'string|nullable',
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

            'is_billing_same_as_shipping' => Sanitizer::BOOL,

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
            'admin_notes' => Sanitizer::TEXT,
        ];
    }
}
