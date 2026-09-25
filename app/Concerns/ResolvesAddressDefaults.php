<?php

namespace Kirki\Ecommerce\App\Concerns;

/**
 * Resolves default shipping and default billing among a set of address payloads.
 *
 * Shared by customer creation and update so both resolve exactly one default
 * shipping and one default billing address the same way: the caller-marked
 * address wins, falling back to the first address when none is marked.
 *
 * @since 1.0.0
 */
trait ResolvesAddressDefaults
{
    /**
     * Resolve which supplied address is the default shipping address and
     * which is the default billing address, and set every address's flags
     * to match - forcing false on every non-winning address regardless of
     * what the caller submitted.
     *
     * @since 1.0.0
     *
     * @param array $addresses Addresses to resolve defaults among.
     * @return array The same addresses with default flags resolved; empty when none were supplied.
     */
    protected function resolve_addresses(array $addresses)
    {
        if (empty($addresses)) {
            return [];
        }

        $shipping_winner = $this->find_default($addresses, 'is_default_shipping') ?? $addresses[0];
        $billing_winner = $this->find_default($addresses, 'is_default_billing') ?? $addresses[0];

        foreach ($addresses as $address) {
            $address->is_default_shipping = $address === $shipping_winner;
            $address->is_default_billing = $address === $billing_winner;
        }

        return $addresses;
    }

    /**
     * Find the first address whose given default flag is set.
     *
     * @since 1.0.0
     *
     * @param array  $addresses Addresses to search.
     * @param string $flag      Address property to test, e.g. is_default_shipping.
     * @return mixed|null Null when no address has the flag set.
     */
    protected function find_default(array $addresses, string $flag)
    {
        foreach ($addresses as $address) {
            if (!empty($address->{$flag})) {
                return $address;
            }
        }

        return null;
    }
}
