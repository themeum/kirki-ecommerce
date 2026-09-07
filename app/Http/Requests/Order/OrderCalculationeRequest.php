<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class OrderCalculationeRequest extends Request
{
    public function rules()
    {
        return [
            'customer_id' => 'nullable|integer',
            'items' => 'nullable|array|min:1',
            'items.*.variant_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',

            'currency_code' => 'nullable|string',
            'payment_provider' => 'nullable|string',
            'coupon_code' => 'nullable|string',

            'shipping_method' => 'nullable|string',
            'shipping_first_name' => 'nullable|string',
            'shipping_last_name' => 'nullable|string',
            'shipping_address_line1' => 'nullable|string',
            'shipping_address_line2' => 'nullable|string',
            'shipping_city' => 'nullable|string',
            'shipping_state' => 'nullable|string',
            'shipping_postcode' => 'nullable|string',
            'shipping_country' => 'nullable|string',
            'shipping_phone' => 'nullable|string',
            'shipping_email' => 'nullable|email',
            'shipping_company' => 'nullable|string',

            'billing_first_name' => 'nullable|string',
            'billing_last_name' => 'nullable|string',
            'billing_address_line1' => 'nullable|string',
            'billing_address_line2' => 'nullable|string',
            'billing_city' => 'nullable|string',
            'billing_state' => 'nullable|string',
            'billing_postcode' => 'nullable|string',
            'billing_country' => 'nullable|string',
            'billing_phone' => 'nullable|string',
            'billing_email' => 'nullable|email',
            'billing_company' => 'nullable|string',

            'customer_email' => 'nullable|email',
            'customer_phone' => 'nullable|string',

            'admin_notes' => 'nullable|string',
            'is_manual' => 'nullable|boolean',
        ];
    }

    public function filters()
    {
        return [
            'customer_id' => Sanitizer::INT,
            'items' => Sanitizer::ARRAY,
            'items.*.variant_id' => Sanitizer::INT,
            'items.*.quantity' => Sanitizer::INT,

            'currency_code' => Sanitizer::TEXT,
            'payment_provider' => Sanitizer::TEXT,
            'coupon_code' => Sanitizer::TEXT,

            'shipping_method' => Sanitizer::TEXT,

            'shipping_first_name' => Sanitizer::TEXT,
            'shipping_last_name' => Sanitizer::TEXT,
            'shipping_address_line1' => Sanitizer::TEXT,
            'shipping_address_line2' => Sanitizer::TEXT,
            'shipping_city' => Sanitizer::TEXT,
            'shipping_state' => Sanitizer::TEXT,
            'shipping_postcode' => Sanitizer::TEXT,
            'shipping_country' => Sanitizer::TEXT,
            'shipping_phone' => Sanitizer::TEXT,
            'shipping_email' => Sanitizer::EMAIL,
            'shipping_company' => Sanitizer::TEXT,

            'billing_first_name' => Sanitizer::TEXT,
            'billing_last_name' => Sanitizer::TEXT,
            'billing_address_line1' => Sanitizer::TEXT,
            'billing_address_line2' => Sanitizer::TEXT,
            'billing_city' => Sanitizer::TEXT,
            'billing_state' => Sanitizer::TEXT,
            'billing_postcode' => Sanitizer::TEXT,
            'billing_country' => Sanitizer::TEXT,
            'billing_phone' => Sanitizer::TEXT,
            'billing_email' => Sanitizer::EMAIL,
            'billing_company' => Sanitizer::TEXT,

            'customer_email' => Sanitizer::EMAIL,
            'customer_phone' => Sanitizer::TEXT,
            'admin_notes' => Sanitizer::TEXT,
            'is_manual' => Sanitizer::BOOL,
        ];
    }
}
