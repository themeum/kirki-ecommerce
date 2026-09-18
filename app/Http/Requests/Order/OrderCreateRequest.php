<?php

namespace Kirki\Ecommerce\App\Http\Requests\Order;

use Kirki\Ecommerce\App\Concerns\ValidatesAddressFields;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Constants\ConsentLocations;
use Kirki\Ecommerce\App\Services\LegalConsentService;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;

class OrderCreateRequest extends Request
{
    use ValidatesAddressFields;

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
        $this->merge([
            'is_billing_same_as_shipping' => $this->input('is_billing_same_as_shipping') ?? true,
            'customer_id' => $customer->get_customer_id() ?? 0,
            'is_manual' => $this->input('is_manual') ?? false,
            'is_guest' => !$customer->is_logged_in(),
            'currency_code' => $this->input('currency_code') ?? Money::resolve_display_currency(),
        ]);
    }

    public function rules()
    {
        $shipping_country = (string) $this->input('shipping_country');

        return [
            'customer_id' => 'nullable|integer',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',

            /**
             * A closure rather than required_if: a non-wildcard closure runs
             * even when the key is absent from the payload, so a storefront
             * bundle that predates consents is still rejected instead of
             * skipping the check. Admin-created orders are exempt - no
             * shopper is present to accept anything.
             */
            'consents' => function ($value, $key, $data) {
                if (!empty($data['is_manual'])) {
                    return true;
                }

                $accepted = is_array($value) ? array_map('strval', $value) : [];
                $missing = array_diff(
                    app(LegalConsentService::class)->get_mandatory_ids(ConsentLocations::CHECKOUT),
                    $accepted
                );

                if (!empty($missing)) {
                    return __('Please accept the required terms to continue.', 'kirki-ecommerce');
                }

                return true;
            },

            'currency_code' => 'nullable|string',
            'payment_provider' => 'required_if:is_manual,0|nullable|string',
            'coupon_codes' => 'nullable|array',
            'coupon_codes.*' => 'string',

            'shipping_method' => 'required|string',
            'shipping_id' => 'nullable|numeric',
            'shipping_first_name' => 'required|string',
            'shipping_last_name' => 'required|string',
            'shipping_address_line1' => 'required|string',
            'shipping_address_line2' => 'nullable|string',
            'shipping_city' => 'required|string',
            'shipping_state' => static::address_field_rule($shipping_country, 'state'),
            'shipping_postal_code' => static::address_field_rule($shipping_country, 'postal_code'),
            'shipping_country' => 'required|string',
            'shipping_phone' => 'nullable|string',
            'shipping_email' => 'nullable|email',
            'shipping_company' => 'nullable|string',

            'is_billing_same_as_shipping' => 'required|boolean',

            'billing_id' => 'nullable|numeric',
            'billing_first_name' => 'required_if:is_billing_same_as_shipping,0|string|nullable',
            'billing_last_name' => 'required_if:is_billing_same_as_shipping,0|string|nullable',
            'billing_address_line1' => 'required_if:is_billing_same_as_shipping,0|string|nullable',
            'billing_address_line2' => 'nullable|string',
            'billing_city' => 'required_if:is_billing_same_as_shipping,0|string|nullable',
            'billing_state' => $this->billing_address_field_rule('state'),
            'billing_postal_code' => $this->billing_address_field_rule('postal_code'),
            'billing_country' => 'required_if:is_billing_same_as_shipping,0|string|nullable',
            'billing_phone' => 'nullable|string',
            'billing_email' => 'nullable|email',
            'billing_company' => 'nullable|string',

            'customer_email' => 'required_if:is_guest,1|nullable|email',
            'customer_notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
            'is_manual' => 'nullable|boolean',
        ];
    }

    /**
     * Build a billing field's rule, honouring the "same as shipping" shortcut.
     *
     * When billing mirrors shipping the field is not submitted at all, so it
     * stays nullable; otherwise the billing country's own rules decide whether
     * it is required, exactly as they do for shipping.
     *
     * @param string $field Either 'state' or 'postal_code'.
     *
     * @return string
     */
    protected function billing_address_field_rule(string $field)
    {
        if (filter_var($this->input('is_billing_same_as_shipping'), FILTER_VALIDATE_BOOLEAN)) {
            return 'nullable|string';
        }

        return static::address_field_rule((string) $this->input('billing_country'), $field);
    }

    public function messages()
    {
        return [
            'shipping_state.required' => static::state_required_message((string) $this->input('shipping_country')),
            'billing_state.required' => static::state_required_message((string) $this->input('billing_country')),
        ];
    }

    public function filters()
    {
        return [
            'customer_id' => Sanitizer::INT,
            'items' => Sanitizer::ARRAY,
            'items.*.variant_id' => Sanitizer::INT,
            'items.*.quantity' => Sanitizer::INT,

            'consents' => Sanitizer::ARRAY,
            'consents.*' => Sanitizer::TEXT,

            'currency_code' => Sanitizer::TEXT,
            'payment_provider' => Sanitizer::TEXT,
            'coupon_codes' => Sanitizer::ARRAY,
            'coupon_codes.*' => Sanitizer::TEXT,

            'shipping_method' => Sanitizer::TEXT,

            'shipping_id' => Sanitizer::INT,
            'shipping_first_name' => Sanitizer::TEXT,
            'shipping_last_name' => Sanitizer::TEXT,
            'shipping_address_line1' => Sanitizer::TEXT,
            'shipping_address_line2' => Sanitizer::TEXT,
            'shipping_city' => Sanitizer::TEXT,
            'shipping_state' => Sanitizer::TEXT,
            'shipping_postal_code' => Sanitizer::TEXT,
            'shipping_country' => Sanitizer::TEXT,
            'shipping_phone' => Sanitizer::TEXT,
            'shipping_email' => Sanitizer::EMAIL,
            'shipping_company' => Sanitizer::TEXT,

            'is_billing_same_as_shipping' => Sanitizer::BOOL,

            'billing_id' => Sanitizer::INT,
            'billing_first_name' => Sanitizer::TEXT,
            'billing_last_name' => Sanitizer::TEXT,
            'billing_address_line1' => Sanitizer::TEXT,
            'billing_address_line2' => Sanitizer::TEXT,
            'billing_city' => Sanitizer::TEXT,
            'billing_state' => Sanitizer::TEXT,
            'billing_postal_code' => Sanitizer::TEXT,
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
