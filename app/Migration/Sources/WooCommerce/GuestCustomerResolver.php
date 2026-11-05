<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\CustomerService;

use function Kirki\Ecommerce\Framework\app;

/**
 * Finds or creates the Kirki customer for the billing contact of an order.
 *
 * A guest has no WordPress user, so the customer is matched by email, ignoring case. An existing
 * customer with that email, registered or guest, is reused. A new one is created once for each email.
 *
 * @since 1.0.0
 */
class GuestCustomerResolver
{
    /** @var array<string, int> Customer ids found or created so far, by lower-case email. */
    protected $customer_ids = [];

    /** @var bool Whether the last call created the customer. */
    protected $created = false;

    /**
     * Check whether the last call created a customer.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function was_created()
    {
        return $this->created;
    }

    /**
     * Get the Kirki customer id for an email, creating a guest customer when none has it.
     *
     * @since 1.0.0
     *
     * @param string      $email The billing email.
     * @param string      $first The billing first name.
     * @param string      $last  The billing last name.
     * @param string|null $phone The billing phone.
     * @return int|null Null when the order has no email.
     */
    public function resolve(string $email, string $first, string $last, $phone = null)
    {
        $key = strtolower(trim($email));
        $this->created = false;

        if ($key === '') {
            return null;
        }

        if (isset($this->customer_ids[$key])) {
            return $this->customer_ids[$key];
        }

        $existing = Customer::query()->where_raw('LOWER(email) = %s', [$key])->first();

        if ($existing) {
            return $this->customer_ids[$key] = (int) $existing->id;
        }

        $customer = app(CustomerService::class)->create(new CreateCustomerDTO([
            'first_name' => $first,
            'last_name' => $last,
            'email' => trim($email),
            'phone' => $phone !== '' ? $phone : null,
            'tags' => null,
        ]));

        $this->created = true;

        return $this->customer_ids[$key] = (int) $customer->id;
    }
}
