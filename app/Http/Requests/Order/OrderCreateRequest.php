<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;
use function Kirki\Ecommerce\App\customer;

class OrderCreateRequest extends Request
{
    public function authorize()
    {
        if(!customer()->is_admin() 
            && !empty($this->input('customer_id')) 
            && $this->input('customer_id') !== customer()->get_customer_id()
            && $this->input('is_manual')
        ) {
            return false;
        }

        return true;
    }

    public function prepare_for_validation()
    {
        $customer_id = $this->input('customer_id') ?? null;
        $is_billing_same_as_shipping = $this->input('is_billing_same_as_shipping') ?? customer(null, $customer_id)->get_customer()->is_billing_same_as_shipping ?? false;

        $shipping_address = [
            'shipping_first_name' => $this->input('shipping_first_name') ?? customer(null, $customer_id)->get_shipping_address()->first_name,
            'shipping_last_name' => $this->input('shipping_last_name') ?? customer(null, $customer_id)->get_shipping_address()->last_name,
            'shipping_address_line1' => $this->input('shipping_address_line1') ?? customer(null, $customer_id)->get_shipping_address()->address_line1,
            'shipping_address_line2' => $this->input('shipping_address_line2') ?? customer(null, $customer_id)->get_shipping_address()->address_line2,
            'shipping_city' => $this->input('shipping_city') ?? customer(null, $customer_id)->get_shipping_address()->city,
            'shipping_state' => $this->input('shipping_state') ?? customer(null, $customer_id)->get_shipping_address()->state,
            'shipping_postcode' => $this->input('shipping_postcode') ?? customer(null, $customer_id)->get_shipping_address()->postal_code,
            'shipping_country' => $this->input('shipping_country') ?? customer(null, $customer_id)->get_shipping_address()->country,
            'shipping_phone' => $this->input('shipping_phone') ?? customer(null, $customer_id)->get_shipping_address()->phone,
            'shipping_email' => $this->input('shipping_email') ?? customer(null, $customer_id)->get_shipping_address()->email,
        ];

        if($is_billing_same_as_shipping){
            $billing_address = [
                'billing_first_name' => $shipping_address['shipping_first_name'],
                'billing_last_name' => $shipping_address['shipping_last_name'],
                'billing_address_line1' => $shipping_address['shipping_address_line1'],
                'billing_address_line2' => $shipping_address['shipping_address_line2'],
                'billing_city' => $shipping_address['shipping_city'],
                'billing_state' => $shipping_address['shipping_state'],
                'billing_postcode' => $shipping_address['shipping_postcode'],
                'billing_country' => $shipping_address['shipping_country'],
                'billing_phone' => $shipping_address['shipping_phone'],
                'billing_email' => $shipping_address['shipping_email'],
            ];
        } else{
            $billing_address = [
                'billing_first_name' => $this->input('billing_first_name') ?? customer(null, $customer_id)->get_billing_address()->first_name,
                'billing_last_name' => $this->input('billing_last_name') ?? customer(null, $customer_id)->get_billing_address()->last_name,
                'billing_address_line1' => $this->input('billing_address_line1') ?? customer(null, $customer_id)->get_billing_address()->address_line1,
                'billing_address_line2' => $this->input('billing_address_line2') ?? customer(null, $customer_id)->get_billing_address()->address_line2,
                'billing_city' => $this->input('billing_city') ?? customer(null, $customer_id)->get_billing_address()->city,
                'billing_state' => $this->input('billing_state') ?? customer(null, $customer_id)->get_billing_address()->state,
                'billing_postcode' => $this->input('billing_postcode') ?? customer(null, $customer_id)->get_billing_address()->postal_code,
                'billing_country' => $this->input('billing_country') ?? customer(null, $customer_id)->get_billing_address()->country,
                'billing_phone' => $this->input('billing_phone') ?? customer(null, $customer_id)->get_billing_address()->phone,
                'billing_email' => $this->input('billing_email') ?? customer(null, $customer_id)->get_billing_address()->email,
            ];
        } 

        $this->merge($shipping_address);
        $this->merge($billing_address);
        $this->merge([
            'customer_id' => $customer_id ?? customer()->get_customer_id() ?? 0,
            'is_billing_same_as_shipping' => $is_billing_same_as_shipping,
            'is_manual' => $this->input('is_manual') ?? false
        ]);
    }

    public function rules()
    {
        return [
            'customer_id' => 'nullable|integer',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',

            'currency_code' => 'nullable|string',
            'payment_method' => 'required_if:is_manual,0|nullable|string',
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

            'is_billing_same_as_shipping' => 'required|boolean',

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

            'customer_notes' => 'nullable|string',
            'is_manual' => 'nullable|boolean',
        ];
    }

    public function filters()
    {
        return [
            'customer_id' => Sanitizer::INT,
            'items.*.variant_id' => Sanitizer::INT,
            'items.*.quantity' => Sanitizer::INT,

            'currency_code' => Sanitizer::TEXT,
            'payment_method' => Sanitizer::TEXT,
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

            'is_billing_same_as_shipping' => Sanitizer::BOOL,

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
            'customer_notes' => Sanitizer::TEXT,
            'is_manual' => Sanitizer::BOOL,
        ];
    }
}
