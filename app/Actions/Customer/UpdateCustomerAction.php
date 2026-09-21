<?php

namespace Kirki\Ecommerce\App\Actions\Customer;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\UpdateCustomerDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Updates a customer together with its shipping and billing addresses in one transaction.
 *
 * @since 1.0.0
 */
class UpdateCustomerAction
{
    /** @var CustomerService */
    protected $customer_service;

    /** @var AddressService */
    protected $address_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CustomerService $customer_service Customer persistence service.
     * @param AddressService  $address_service  Address persistence service.
     */
    public function __construct(
        CustomerService $customer_service,
        AddressService $address_service
    ) {
        $this->customer_service = $customer_service;
        $this->address_service = $address_service;
    }

    /**
     * Update a customer with the given shipping and billing addresses.
     *
     * The customer and addresses will be updated in a single transaction.
     * If either the customer or an address cannot be updated, a Throwable will be thrown.
     * Each address payload is matched to the customer's existing address of that kind.
     *
     * @since 1.0.0
     *
     * @param UpdateCustomerDTO $customer_payload         Customer data to save.
     * @param UpdateAddressDTO  $shipping_address_payload Shipping address data to save.
     * @param UpdateAddressDTO  $billing_address_payload  Billing address data to save.
     * @return Customer The updated customer.
     * @throws Throwable When the customer or an address cannot be updated; the transaction is rolled back.
     */
    public function execute(UpdateCustomerDTO $customer_payload, UpdateAddressDTO $shipping_address_payload, UpdateAddressDTO $billing_address_payload)
    {
        DB::begin_transaction();

        try {
            $customer = $this->customer_service->update($customer_payload);

            throw_if(empty($customer), __('Customer could not be updated.', 'kirki-ecommerce'));

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
