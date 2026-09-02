<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;
use function Kirki\Ecommerce\App\customer;

class OrderCreateRequest extends Request
{
    public function authorize()
    {
        if (customer()->is_admin()) {
            return true;
        }

        if (!empty($this->input('customer_id')) && (int) $this->input('customer_id') !== customer()->get_customer_id()) {
            return false;
        }

        return !$this->input('is_manual');
    }

    protected function prepare_for_validation()
    {
        $customer = customer(null, $this->input('customer_id') ?? null);
        $shipping = $customer->get_shipping_address();
        $is_billing_same_as_shipping = $this->input('is_billing_same_as_shipping') ?? $customer->get_customer()->is_billing_same_as_shipping ?? false;

        $shipping_address = [
            'shipping_first_name' => $this->input('shipping_first_name') ?? $shipping->first_name ?? null,
            'shipping_last_name' => $this->input('shipping_last_name') ?? $shipping->last_name ?? null,
            'shipping_address_line1' => $this->input('shipping_address_line1') ?? $shipping->address_line1 ?? null,
            'shipping_address_line2' => $this->input('shipping_address_line2') ?? $shipping->address_line2 ?? null,
            'shipping_city' => $this->input('shipping_city') ?? $shipping->city ?? null,
            'shipping_state' => $this->input('shipping_state') ?? $shipping->state ?? null,
            'shipping_postcode' => $this->input('shipping_postcode') ?? $shipping->postal_code ?? null,
            'shipping_country' => $this->input('shipping_country') ?? $shipping->country ?? null,
            'shipping_phone' => $this->input('shipping_phone') ?? $shipping->phone ?? null,
            'shipping_email' => $this->input('shipping_email') ?? $shipping->email ?? null,
        ];

        if ($is_billing_same_as_shipping) {
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
        } else {
            $billing = $customer->get_billing_address();

            $billing_address = [
                'billing_first_name' => $this->input('billing_first_name') ?? $billing->first_name ?? null,
                'billing_last_name' => $this->input('billing_last_name') ?? $billing->last_name ?? null,
                'billing_address_line1' => $this->input('billing_address_line1') ?? $billing->address_line1 ?? null,
                'billing_address_line2' => $this->input('billing_address_line2') ?? $billing->address_line2 ?? null,
                'billing_city' => $this->input('billing_city') ?? $billing->city ?? null,
                'billing_state' => $this->input('billing_state') ?? $billing->state ?? null,
                'billing_postcode' => $this->input('billing_postcode') ?? $billing->postal_code ?? null,
                'billing_country' => $this->input('billing_country') ?? $billing->country ?? null,
                'billing_phone' => $this->input('billing_phone') ?? $billing->phone ?? null,
                'billing_email' => $this->input('billing_email') ?? $billing->email ?? null,
            ];
        }

        $this->merge($shipping_address);
        $this->merge($billing_address);
        $this->merge([
            'customer_id' => $customer->get_customer_id() ?? 0,
            'is_billing_same_as_shipping' => $is_billing_same_as_shipping,
            'is_manual' => $this->input('is_manual') ?? false,
            'is_guest' => !$customer->is_logged_in()
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
            'payment_provider' => 'required_if:is_manual,0|nullable|string',
            'coupon_codes' => 'nullable|array',
            'coupon_codes.*' => 'string',

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

            'customer_email' => 'required_if:is_guest,1|nullable|email',
            'customer_notes' => 'nullable|string',
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
            'coupon_codes' => Sanitizer::ARRAY,
            'coupon_codes.*' => Sanitizer::TEXT,

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
            'customer_notes' => Sanitizer::TEXT,
            'admin_notes' => Sanitizer::TEXT,
            'is_manual' => Sanitizer::BOOL,
        ];
    }
}
