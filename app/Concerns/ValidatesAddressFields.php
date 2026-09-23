<?php

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\App\Supports\AddressRules;

use function Kirki\Ecommerce\Framework\deep_get;

/**
 * Builds address validation rules from the selected country's own rules.
 *
 * A country with no subdivisions, or no postal codes, must not have those
 * fields demanded of it. Every request that accepts an address asks here
 * rather than hard-coding `required`, so a customer gets the same answer
 * wherever the address is submitted from.
 *
 * @since 1.0.0
 */
trait ValidatesAddressFields
{
    /**
     * Build a validation rule for an address field from the country's rules.
     *
     * @since 1.0.0
     *
     * @param string $country Country code from the submitted address.
     * @param string $field   Either 'state' or 'postal_code'.
     * @return string Validation rule string, required only when the country demands the field.
     */
    protected static function address_field_rule(string $country, string $field)
    {
        return AddressRules::is_required($country, $field) ? 'required|string' : 'nullable|string';
    }

    /**
     * Build the "field is required" message naming the country's own term.
     *
     * @since 1.0.0
     *
     * @param string $country Country code from the submitted address.
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
     * @since 1.0.0
     *
     * @param string $address_key Either 'shipping_address' or 'billing_address'.
     * @return string Country code, or an empty string when the block or its country is missing.
     */
    protected function address_block_country(string $address_key)
    {
        $address = $this->input($address_key);

        return is_array($address) ? (string) ($address['country'] ?? '') : '';
    }

    /**
     * Build a closure rule for an `addresses.*` field the row's own country may not use.
     *
     * Layers the country's own rule on top of the value itself, so a country with no
     * subdivisions or postal codes is never asked for them. Reads the country from the
     * same row as the field being validated, since a wildcard rule's own leaf value
     * cannot see its siblings. The callback returns true when valid, a state-required
     * message string for a missing state, or false for any other missing field.
     *
     * @since 1.0.0
     *
     * @param string $field Either 'state' or 'postal_code'.
     * @return \Closure Rule callback.
     */
    protected function address_item_field_rule(string $field)
    {
        return function ($value, $key, $data) use ($field) {
            $country = (string) deep_get($data, static::address_item_key($key, 'country'), '');

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

    /**
     * Build a closure rule requiring an `addresses.*` field once its row has other content.
     *
     * An `addresses.*` item is always present as an array element once appended on the
     * frontend, so presence can't be read off a fixed block key the way
     * `required_when_address_present()` does. Instead, the row counts as touched once
     * any of its own content fields (name, contact, address lines, city, country) holds
     * a value, ignoring metadata fields (id, type, label, is_default_shipping,
     * is_default_billing) that carry a default regardless of whether the row was filled in.
     *
     * @since 1.0.0
     *
     * @param string $field Address item field this rule is being built for.
     * @return \Closure Rule callback returning true when the value is acceptable, false otherwise.
     */
    protected function required_when_address_item_present(string $field)
    {
        return function ($value, $key, $data) use ($field) {
            $row = (array) deep_get($data, static::address_item_row_key($key), []);

            if (!static::address_item_is_touched($row, $field)) {
                return true;
            }

            return is_string($value) && $value !== '';
        };
    }

    /**
     * Build a closure rule requiring an `addresses.*` field once the row's own type matches.
     *
     * Reads `type` from the same row as the field being validated, rather than
     * `required_if:addresses.*.type,others`, which the framework's validator resolves
     * against the full request payload instead of the current wildcard row.
     *
     * @since 1.0.0
     *
     * @param string $field      Address item field this rule is being built for.
     * @param string $type_value Row `type` value that makes the field required.
     * @return \Closure Rule callback returning true when the value is acceptable, false otherwise.
     */
    protected function required_when_address_item_type(string $field, string $type_value)
    {
        return function ($value, $key, $data) use ($type_value) {
            $type = (string) deep_get($data, static::address_item_key($key, 'type'), '');

            if ($type !== $type_value) {
                return true;
            }

            return is_string($value) && $value !== '';
        };
    }

    /**
     * Resolve the dot-notated key of the `addresses.*` row a leaf key belongs to.
     *
     * @since 1.0.0
     *
     * @param string $key Concrete, expanded rule key, e.g. `addresses.0.state`.
     * @return string The row's own key, e.g. `addresses.0`.
     */
    protected static function address_item_row_key(string $key)
    {
        return substr($key, 0, strrpos($key, '.'));
    }

    /**
     * Resolve the dot-notated key of a sibling field on the same `addresses.*` row.
     *
     * @since 1.0.0
     *
     * @param string $key   Concrete, expanded rule key, e.g. `addresses.0.state`.
     * @param string $field Sibling field name on the same row, e.g. `country`.
     * @return string The sibling's own key, e.g. `addresses.0.country`.
     */
    protected static function address_item_key(string $key, string $field)
    {
        return static::address_item_row_key($key) . '.' . $field;
    }

    /**
     * Check whether an `addresses.*` row has content besides the given field and metadata.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row          The row's own submitted fields.
     * @param string               $except_field Field to exclude from the check.
     * @return bool
     */
    protected static function address_item_is_touched(array $row, string $except_field)
    {
        $ignored_fields = ['id', 'type', 'label', 'is_default_shipping', 'is_default_billing', $except_field];

        foreach ($row as $row_field => $row_value) {
            if (in_array($row_field, $ignored_fields, true)) {
                continue;
            }

            if (is_string($row_value) && $row_value !== '') {
                return true;
            }
        }

        return false;
    }
}
