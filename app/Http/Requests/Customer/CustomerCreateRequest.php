<?php

namespace Kirki\Ecommerce\App\Http\Requests\Customer;

use Kirki\Ecommerce\App\Concerns\ValidatesAddressFields;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

/**
 * Validates and sanitizes the payload for creating a customer.
 *
 * @since 1.0.0
 */
class CustomerCreateRequest extends Request
{
    use ValidatesAddressFields;

    /**
     * Give the optional fields of each submitted address an empty value.
     *
     * `addresses.*.state` and `addresses.*.postal_code` are NOT NULL. A country that
     * uses neither can legitimately submit an address without them, so the absent
     * value is coerced to an empty string rather than widening the schema.
     * `addresses.*.type` is also NOT NULL; a row that omits it defaults to `home`.
     *
     * Runs before validation, which treats an empty string as missing, so a
     * country that does require the field still fails.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function prepare_for_validation()
    {
        $addresses = $this->input('addresses');

        if (!is_array($addresses)) {
            return;
        }

        foreach ($addresses as $index => $address) {
            if (!is_array($address)) {
                continue;
            }

            foreach (['state', 'postal_code'] as $field) {
                if (($address[$field] ?? null) === null) {
                    $address[$field] = '';
                }
            }

            if (($address['type'] ?? null) === null) {
                $address['type'] = 'home';
            }

            $addresses[$index] = $address;
        }

        $this->merge(['addresses' => $addresses]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'first_name' => 'required|string',
            'last_name' => 'string|nullable',
            'photo' => 'integer|nullable',
            'email' => 'required|email|unique:' . Customer::get_table_name() . ',email',
            'phone' => 'string|nullable',
            'accepts_marketing' => 'boolean|nullable',
            'create_wordpress_user' => 'boolean|nullable',
            'notes' => 'string|nullable',
            'language' => 'string|nullable',
            'tags' => 'array|nullable',
            'tags.*' => 'string',
            'addresses' => 'array|nullable',
            'addresses.*.id' => 'integer|nullable',
            'addresses.*.first_name' => $this->required_when_address_item_present('first_name'),
            'addresses.*.last_name' => 'nullable|string',
            'addresses.*.email' => 'nullable|string',
            'addresses.*.phone' => 'nullable|string',
            'addresses.*.address_line1' => $this->required_when_address_item_present('address_line1'),
            'addresses.*.address_line2' => 'nullable|string',
            'addresses.*.city' => 'nullable|string',
            'addresses.*.state' => $this->address_item_field_rule('state'),
            'addresses.*.postal_code' => $this->address_item_field_rule('postal_code'),
            'addresses.*.country' => 'required|string',
            'addresses.*.type' => 'nullable|string|in:home,office,others',
            'addresses.*.label' => $this->required_when_address_item_type('label', 'others'),
            'addresses.*.is_default_shipping' => 'boolean|nullable',
            'addresses.*.is_default_billing' => 'boolean|nullable',
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
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
            'addresses' => Sanitizer::ARRAY,
            'addresses.*.id' => Sanitizer::INT,
            'addresses.*.first_name' => Sanitizer::TEXT,
            'addresses.*.last_name' => Sanitizer::TEXT,
            'addresses.*.email' => Sanitizer::TEXT,
            'addresses.*.phone' => Sanitizer::TEXT,
            'addresses.*.address_line1' => Sanitizer::TEXT,
            'addresses.*.address_line2' => Sanitizer::TEXT,
            'addresses.*.city' => Sanitizer::TEXT,
            'addresses.*.state' => Sanitizer::TEXT,
            'addresses.*.postal_code' => Sanitizer::TEXT,
            'addresses.*.country' => Sanitizer::TEXT,
            'addresses.*.type' => Sanitizer::TEXT,
            'addresses.*.label' => Sanitizer::TEXT,
            'addresses.*.is_default_shipping' => Sanitizer::BOOL,
            'addresses.*.is_default_billing' => Sanitizer::BOOL,
        ];
    }
}
