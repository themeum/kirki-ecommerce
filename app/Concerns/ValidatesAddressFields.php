<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\App\Supports\AddressRules;

/**
 * Builds address validation rules from the selected country's own rules.
 *
 * A country with no subdivisions, or no postal codes, must not have those
 * fields demanded of it. Every request that accepts an address asks here
 * rather than hard-coding `required`, so a customer gets the same answer
 * wherever the address is submitted from.
 */
trait ValidatesAddressFields
{
    /**
     * Build a validation rule for an address field from the country's rules.
     *
     * @param string $country Country code from the submitted address.
     * @param string $field   Either 'state' or 'postal_code'.
     *
     * @return string
     */
    protected static function address_field_rule(string $country, string $field)
    {
        return AddressRules::is_required($country, $field) ? 'required|string' : 'nullable|string';
    }

    /**
     * Build the "field is required" message naming the country's own term.
     *
     * @param string $country Country code from the submitted address.
     *
     * @return string
     */
    protected static function state_required_message(string $country)
    {
        return sprintf(
            /* translators: %s is the country's term for its subdivision, e.g. State, Prefecture, Emirate. */
            __('%s is required.', 'kirki-ecommerce'),
            AddressRules::state_label($country)
        );
    }

    /**
     * Read the country code out of a nested address block.
     *
     * @param string $address_key Either 'shipping_address' or 'billing_address'.
     *
     * @return string
     */
    protected function address_block_country(string $address_key)
    {
        $address = $this->input($address_key);

        return is_array($address) ? (string) ($address['country'] ?? '') : '';
    }
}
