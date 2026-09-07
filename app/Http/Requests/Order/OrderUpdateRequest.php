<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\App\customer;

class OrderUpdateRequest extends Request
{
    public function authorize()
    {
        return customer()->is_admin();
    }

    protected function prepare_for_validation()
    {
        $customer_id = $this->input('customer_id') ?? null;

        $this->merge([
            'customer_id' => $customer_id ?? 0,
        ]);
    }

    public function rules()
    {
        return [
            'id' => 'required|integer',
            'customer_id' => 'nullable|integer',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|integer',
            'items.*.variant_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',

            'currency_code' => 'nullable|string',
            'coupon_code' => 'nullable|string',

            'shipping_method' => 'required|string',

            'shipping_first_name' => 'required|string',
            'shipping_last_name' => 'required|string',
            'shipping_address_line1' => 'required|string',
            'shipping_address_line2' => 'nullable|string',
            'shipping_city' => 'required|string',
            'shipping_state' => 'required|string',
            'shipping_postcode' => 'required|string',
            'shipping_country' => 'required|string',
            'shipping_phone' => 'nullable|string',
            'shipping_email' => 'nullable|email',
            'shipping_company' => 'nullable|string',

            'billing_first_name' => 'required|string',
            'billing_last_name' => 'required|string',
            'billing_address_line1' => 'required|string',
            'billing_address_line2' => 'nullable|string',
            'billing_city' => 'required|string',
            'billing_state' => 'required|string',
            'billing_postcode' => 'required|string',
            'billing_country' => 'required|string',
            'billing_phone' => 'nullable|string',
            'billing_email' => 'nullable|email',
            'billing_company' => 'nullable|string',

            'customer_email' => 'nullable|email',
            'customer_phone' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'flags' => 'nullable|array',
            'flags.*' => 'string',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'customer_id' => Sanitizer::INT,
            'items' => Sanitizer::ARRAY,
            'items.*.id' => Sanitizer::INT,
            'items.*.variant_id' => Sanitizer::INT,
            'items.*.quantity' => Sanitizer::INT,

            'currency_code' => Sanitizer::TEXT,
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
            'flags' => Sanitizer::ARRAY,
            'flags.*' => Sanitizer::TEXT,
        ];
    }
}
