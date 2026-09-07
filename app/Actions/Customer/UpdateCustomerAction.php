<?php

namespace Kirki\Ecommerce\App\Actions\Customer;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\UpdateCustomerDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Exception;
use Throwable;

class UpdateCustomerAction
{
    protected $customer_service;
    protected $address_service;

    public function __construct(
        CustomerService $customer_service,
        AddressService $address_service
    ) {
        $this->customer_service = $customer_service;
        $this->address_service = $address_service;
    }

    /**
     * Updates a customer with the given address.
     *
     * The customer and address will be updated in a single transaction.
     * If either the customer or address cannot be updated, a Throwable will be thrown.
     *
     * @param UpdateCustomerDTO $customer_payload
     * @param UpdateAddressDTO $billing_address_payload
     * @param UpdateAddressDTO $shipping_address_payload
     * @return Customer
     * @throws Throwable
     */
    public function execute(UpdateCustomerDTO $customer_payload, UpdateAddressDTO $shipping_address_payload, UpdateAddressDTO $billing_address_payload)
    {
        DB::begin_transaction();

        try {
            $customer = $this->customer_service->update($customer_payload);

            if (empty($customer)) {
                throw new Exception(__('Customer could not be updated.', 'kirki-ecommerce'));
            }

            $shipping_address_payload->customer_id = $customer->id;
            $shipping_address_payload->id = $customer->shipping_address->id;
            $shipping_address_payload->type = $customer->shipping_address->type;

            $this->address_service->update($shipping_address_payload);

            $billing_address_payload->customer_id = $customer->id;
            $billing_address_payload->id = $customer->billing_address->id;
            $billing_address_payload->type = $customer->billing_address->type;

            $this->address_service->update($billing_address_payload);

            DB::commit();

            return $this->customer_service->find($customer->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
