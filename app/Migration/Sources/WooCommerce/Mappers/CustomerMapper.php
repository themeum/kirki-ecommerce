<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\AddressType;

/**
 * Maps one WooCommerce customer, a WordPress user with billing and shipping user meta, to Kirki customer and address fields.
 *
 * @since 1.0.0
 */
class CustomerMapper
{
    /** The user meta keys that are read for a customer. */
    public const META_KEYS = [
        'first_name', 'last_name',
        'billing_first_name', 'billing_last_name', 'billing_company', 'billing_address_1', 'billing_address_2',
        'billing_city', 'billing_state', 'billing_postcode', 'billing_country', 'billing_email', 'billing_phone',
        'shipping_first_name', 'shipping_last_name', 'shipping_company', 'shipping_address_1', 'shipping_address_2',
        'shipping_city', 'shipping_state', 'shipping_postcode', 'shipping_country', 'shipping_phone',
    ];

    /**
     * Map a customer row.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row The customer row from the reader.
     * @return array{customer: array<string, mixed>, addresses: array<int, array<string, mixed>>}
     */
    public function map(array $row)
    {
        $meta = $row['meta'];
        $first = $this->first_filled([$meta['first_name'] ?? '', $meta['billing_first_name'] ?? '', $row['display_name'] ?? '']);
        $last = $this->first_filled([$meta['last_name'] ?? '', $meta['billing_last_name'] ?? '']);

        return [
            'customer' => [
                'user_id' => (int) $row['id'],
                'first_name' => $first,
                'last_name' => $last,
                'email' => $row['email'],
                'phone' => ($meta['billing_phone'] ?? '') !== '' ? $meta['billing_phone'] : null,
                'created_at' => strpos((string) $row['registered_at'], '0000-00-00') === 0 ? null : $row['registered_at'],
            ],
            'addresses' => $this->addresses($meta, $first, $last, (string) $row['email']),
        ];
    }

    /**
     * Build the billing and shipping addresses. Two equal addresses become one address with both defaults.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta  The user meta.
     * @param string               $first The customer first name.
     * @param string               $last  The customer last name.
     * @param string               $email The customer email.
     * @return array<int, array<string, mixed>>
     */
    protected function addresses(array $meta, string $first, string $last, string $email)
    {
        $billing = $this->address($meta, 'billing', $first, $last, $email);
        $shipping = $this->address($meta, 'shipping', $first, $last, $email);

        if ($billing !== null && $shipping !== null && $this->same_place($billing, $shipping)) {
            $billing['is_default_shipping'] = true;

            return [$billing];
        }

        return array_values(array_filter([$billing, $shipping]));
    }

    /**
     * Build one address from the user meta of a purpose, or null when it has no street line.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta    The user meta.
     * @param string               $purpose "billing" or "shipping".
     * @param string               $first   The customer first name, used when the address has none.
     * @param string               $last    The customer last name, used when the address has none.
     * @param string               $email   The customer email.
     * @return array<string, mixed>|null
     */
    protected function address(array $meta, string $purpose, string $first, string $last, string $email)
    {
        $line1 = trim((string) ($meta[$purpose . '_address_1'] ?? ''));

        if ($line1 === '') {
            return null;
        }

        return [
            'first_name' => $this->first_filled([$meta[$purpose . '_first_name'] ?? '', $first]),
            'last_name' => $this->first_filled([$meta[$purpose . '_last_name'] ?? '', $last]),
            'address_line1' => $line1,
            'address_line2' => ($meta[$purpose . '_address_2'] ?? '') !== '' ? $meta[$purpose . '_address_2'] : null,
            'city' => (string) ($meta[$purpose . '_city'] ?? ''),
            'state' => (string) ($meta[$purpose . '_state'] ?? ''),
            'country' => (string) ($meta[$purpose . '_country'] ?? ''),
            'postal_code' => (string) ($meta[$purpose . '_postcode'] ?? ''),
            'email' => $purpose === 'billing' ? $this->first_filled([$meta['billing_email'] ?? '', $email]) : null,
            'phone' => ($meta[$purpose . '_phone'] ?? '') !== '' ? $meta[$purpose . '_phone'] : null,
            'type' => AddressType::HOME,
            'is_default_billing' => $purpose === 'billing',
            'is_default_shipping' => $purpose === 'shipping',
        ];
    }

    /**
     * Check whether two addresses are the same place.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $a First address.
     * @param array<string, mixed> $b Second address.
     * @return bool
     */
    protected function same_place(array $a, array $b)
    {
        foreach (['address_line1', 'address_line2', 'city', 'state', 'country', 'postal_code', 'first_name', 'last_name'] as $field) {
            if (strtolower((string) $a[$field]) !== strtolower((string) $b[$field])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the first value that is not empty.
     *
     * @since 1.0.0
     *
     * @param string[] $values The candidates.
     * @return string An empty string when all are empty.
     */
    protected function first_filled(array $values)
    {
        foreach ($values as $value) {
            if (trim((string) $value) !== '') {
                return (string) $value;
            }
        }

        return '';
    }
}
