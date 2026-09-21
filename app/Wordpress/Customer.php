<?php

namespace Kirki\Ecommerce\App\Wordpress;

use Kirki\Ecommerce\App\Models\Customer as CustomerModel;

/**
 * A WordPress user paired with its store customer record and default addresses.
 *
 * @since 1.0.0
 */
class Customer extends User
{
    /**
     * The customer record, or null when the user has none.
     *
     * @var CustomerModel|null
     */
    protected $customer = null;

    /**
     * Load the user and the matching customer record with its default addresses.
     *
     * @since 1.0.0
     *
     * @param int|null $user_id     WordPress user ID; defaults to the current user.
     * @param int|null $customer_id Customer ID to load; defaults to the customer linked to the user.
     */
    public function __construct($user_id = null, $customer_id = null)
    {
        parent::__construct($user_id);

        if (!empty($customer_id)) {
            $this->customer = CustomerModel::with(['billing_address', 'shipping_address'])->find($customer_id);
        } else {
            $this->customer = CustomerModel::with(['billing_address', 'shipping_address'])->where('user_id', $this->get_id())->first();
        }
    }

    /**
     * Get the customer record.
     *
     * @since 1.0.0
     *
     * @return CustomerModel|null Null when no customer record exists.
     */
    public function get_customer()
    {
        return $this->customer;
    }

    /**
     * Get the customer record's ID.
     *
     * @since 1.0.0
     *
     * @return int|null Null when no customer record exists.
     */
    public function get_customer_id()
    {
        return $this->customer->id ?? null;
    }

    /**
     * Get the customer's default shipping address.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\App\Models\Address|null Null when there is no customer or no default shipping address.
     */
    public function get_shipping_address()
    {
        return $this->customer->shipping_address ?? null;
    }

    /**
     * Get the customer's default billing address.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\App\Models\Address|null Null when there is no customer or no default billing address.
     */
    public function get_billing_address()
    {
        return $this->customer->billing_address ?? null;
    }
}
