<?php

namespace Kirki\Ecommerce\App\Wordpress;

use Kirki\Ecommerce\App\Models\Customer as CustomerModel;

class Customer extends User
{
    /**
     * The customer instance
     *
     * @var CustomerModel|null
     */
    protected $customer = null;

    public function __construct($user_id = null, $customer_id = null)
    {
        parent::__construct($user_id);

        if (!empty($customer_id)) {
            $this->customer = CustomerModel::with(['billing_address', 'shipping_address'])->find($customer_id);
        } else {
            $this->customer = CustomerModel::with(['billing_address', 'shipping_address'])->where('user_id', $this->get_id())->first();
        }
    }

    public function get_customer()
    {
        return $this->customer;
    }

    public function get_customer_id()
    {
        return $this->customer->id ?? null;
    }

    public function get_shipping_address()
    {
        return $this->customer->shipping_address;
    }

    public function get_billing_address()
    {
        return $this->customer->billing_address;
    }
}
