<?php

namespace Kirki\Ecommerce\App\Http\Requests\Account;

use Kirki\Ecommerce\App\Concerns\ValidatesAddressFields;
use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class AddressUpdateRequest extends Request
{
    use ValidatesAddressFields;

    public function rules()
    {
        $country = (string) $this->input('country');

        return [
            'id' => 'required|integer',
            'type' => 'required|string|in:' . implode(',', [AddressType::HOME, AddressType::OFFICE, AddressType::OTHERS]),
            'first_name' => 'required|string',
            'last_name' => 'nullable|string',
            'email' => 'nullable|string',
            'phone' => 'nullable|string',
            'address_line1' => 'required|string',
            'address_line2' => 'nullable|string',
            'city' => 'required|string',
            'state' => static::address_field_rule($country, 'state'),
            'postal_code' => static::address_field_rule($country, 'postal_code'),
            'country' => 'required|string',
            'label' => 'nullable|string',
            'is_default_shipping' => 'nullable|boolean',
            'is_default_billing' => 'nullable|boolean',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'type' => Sanitizer::TEXT,
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
            'label' => Sanitizer::TEXT,
            'is_default_shipping' => Sanitizer::BOOL,
            'is_default_billing' => Sanitizer::BOOL,
        ];
    }

    public function messages()
    {
        $country = (string) $this->input('country');

        return [
            'state.required' => static::state_required_message($country),
        ];
    }

    /**
     * Give the optional address fields a concrete empty value.
     *
     * `addresses.state` and `addresses.postal_code` are NOT NULL. Before this
     * change the browser always sent an empty string, so an omitted field
     * never reached the database. Now that a country can legitimately leave
     * one out, coerce the absent value rather than widening the schema - an
     * empty string is what every existing row already holds for "no
     * subdivision", so this keeps one representation instead of two.
     *
     * Runs before validation so the value reaches `sanitized()`, which is what
     * the DTO reads. That is safe because the validator treats an empty string
     * as missing, so a country that requires the field still fails.
     *
     * @return void
     */
    protected function prepare_for_validation()
    {
        $defaults = [];

        foreach (['state', 'postal_code'] as $field) {
            if ($this->input($field) === null) {
                $defaults[$field] = '';
            }
        }

        if ($defaults) {
            $this->merge($defaults);
        }
    }
}
