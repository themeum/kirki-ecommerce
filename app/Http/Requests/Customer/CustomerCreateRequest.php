<?php

namespace Kirki\Ecommerce\App\Http\Requests\Customer;

use Kirki\Ecommerce\App\Concerns\ValidatesAddressFields;
use Kirki\Ecommerce\App\Supports\AddressRules;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class CustomerCreateRequest extends Request
{
    use ValidatesAddressFields;

    /**
     * Give the optional address fields a concrete empty value.
     *
     * `addresses.state` and `addresses.postal_code` are NOT NULL. A country
     * that uses neither now legitimately submits an address without them, so
     * coerce the absent value rather than widening the schema - an empty
     * string is what every existing row already holds for "no subdivision".
     *
     * Runs before validation, which treats an empty string as missing, so a
     * country that does require the field still fails.
     *
     * @return void
     */
    protected function prepare_for_validation()
    {
        foreach (['shipping_address', 'billing_address'] as $address_key) {
            $address = $this->input($address_key);

            if (!is_array($address)) {
                continue;
            }

            foreach (['state', 'postal_code'] as $field) {
                if (($address[$field] ?? null) === null) {
                    $address[$field] = '';
                }
            }

            $this->merge([$address_key => $address]);
        }
    }

    public function rules()
    {
        return [
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
            'shipping_address'               => 'nullable|array',
            'shipping_address.first_name'    => $this->required_when_address_present('shipping_address'),
            'shipping_address.last_name'     => 'nullable|string',
            'shipping_address.email'         => $this->required_when_address_present('shipping_address'),
            'shipping_address.phone'         => $this->required_when_address_present('shipping_address'),
            'shipping_address.address_line1' => $this->required_when_address_present('shipping_address'),
            'shipping_address.address_line2' => 'nullable|string',
            'shipping_address.city'          => $this->required_when_address_present('shipping_address'),
            'shipping_address.state'         => $this->address_field_when_address_present('shipping_address', 'state'),
            'shipping_address.postal_code'      => $this->address_field_when_address_present('shipping_address', 'postal_code'),
            'shipping_address.country'       => $this->required_when_address_present('shipping_address'),
            'billing_address'               => 'nullable|array',
            'billing_address.first_name'    => $this->required_when_address_present('billing_address'),
            'billing_address.last_name'     => 'nullable|string',
            'billing_address.email'         => $this->required_when_address_present('billing_address'),
            'billing_address.phone'         => $this->required_when_address_present('billing_address'),
            'billing_address.address_line1' => $this->required_when_address_present('billing_address'),
            'billing_address.address_line2' => 'nullable|string',
            'billing_address.city'          => $this->required_when_address_present('billing_address'),
            'billing_address.state'         => $this->address_field_when_address_present('billing_address', 'state'),
            'billing_address.postal_code'   => $this->address_field_when_address_present('billing_address', 'postal_code'),
            'billing_address.country'       => $this->required_when_address_present('billing_address'),
        ];
    }

    /**
     * Build a closure rule requiring a string field only when the given
     * top-level address block was submitted at all - shipping_address and
     * billing_address are both optional as a whole, but their fields are
     * still required together when either block is present.
     *
     * @param string $address_key
     * @return \Closure
     */
    protected function required_when_address_present(string $address_key)
    {
        return function ($value, $key, $data) use ($address_key) {
            if (empty($data[$address_key])) {
                return true;
            }

            return is_string($value) && $value !== '';
        };
    }

    /**
     * Build a closure rule for an address field the country may not use.
     *
     * Layers the country's own rule on top of the address-present check: a
     * country with no subdivisions, or no postal codes, must not have the
     * field demanded of it even when the rest of the block was submitted.
     *
     * @param string $address_key
     * @param string $field       Either 'state' or 'postal_code'.
     *
     * @return \Closure
     */
    protected function address_field_when_address_present(string $address_key, string $field)
    {
        return function ($value, $key, $data) use ($address_key, $field) {
            if (empty($data[$address_key])) {
                return true;
            }

            $country = (string) ($data[$address_key]['country'] ?? '');

            if (!AddressRules::is_required($country, $field)) {
                return true;
            }

            if (is_string($value) && $value !== '') {
                return true;
            }

            if ($field === 'state') {
                return static::state_required_message($country);
            }

            return false;
        };
    }

    public function filters()
    {
        return [
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
            'billing_address'               => Sanitizer::ARRAY,
            'billing_address.first_name'    => Sanitizer::TEXT,
            'billing_address.last_name'     => Sanitizer::TEXT,
            'billing_address.email'         => Sanitizer::TEXT,
            'billing_address.phone'         => Sanitizer::TEXT,
            'billing_address.address_line1' => Sanitizer::TEXT,
            'billing_address.address_line2' => Sanitizer::TEXT,
            'billing_address.city'          => Sanitizer::TEXT,
            'billing_address.state'         => Sanitizer::TEXT,
            'billing_address.postal_code'      => Sanitizer::TEXT,
            'billing_address.country'       => Sanitizer::TEXT,
            'shipping_address'               => Sanitizer::ARRAY,
            'shipping_address.first_name'    => Sanitizer::TEXT,
            'shipping_address.last_name'     => Sanitizer::TEXT,
            'shipping_address.email'         => Sanitizer::TEXT,
            'shipping_address.phone'         => Sanitizer::TEXT,
            'shipping_address.address_line1' => Sanitizer::TEXT,
            'shipping_address.address_line2' => Sanitizer::TEXT,
            'shipping_address.city'          => Sanitizer::TEXT,
            'shipping_address.state'         => Sanitizer::TEXT,
            'shipping_address.postal_code'      => Sanitizer::TEXT,
            'shipping_address.country'       => Sanitizer::TEXT,
        ];
    }
}
