<?php

namespace Kirki\Ecommerce\App\Actions\Account;

use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\App\DTO\Account\UpdateAddressPayloadDTO;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

class UpdateAccountAddressesAction
{
    protected $customer_service;
    protected $address_service;

    public function __construct(CustomerService $customer_service, AddressService $address_service)
    {
        $this->customer_service = $customer_service;
        $this->address_service = $address_service;
    }

    /**
     * Update one address (shipping or billing) of the customer linked to the given WordPress user.
     *
     * Updating the billing address also stores is_billing_same_as_shipping on
     * the customer; when true, the billing address is copied from the
     * customer's current shipping address instead of the submitted fields.
     *
     * @param UpdateAddressPayloadDTO $data
     * @return Customer
     * @throws NotFoundException
     * @throws Throwable
     */
    public function execute(UpdateAddressPayloadDTO $data)
    {
        $customer = $this->customer_service->find_by_user_id($data->user_id);

        if (empty($customer) || empty($customer->shipping_address) || empty($customer->billing_address)) {
            throw new NotFoundException(__('Customer address could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        DB::begin_transaction();

        try {
            if ($data->type === AddressType::BILLING) {
                $this->update_billing_address($customer, $data);
            } else {
                $this->update_shipping_address($customer, $data);
            }

            DB::commit();

            return $this->customer_service->find($customer->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }

    protected function update_shipping_address(Customer $customer, UpdateAddressPayloadDTO $data)
    {
        $payload = UpdateAddressDTO::from_array($data->all());
        $payload->id = $customer->shipping_address->id;
        $payload->customer_id = $customer->id;
        $payload->type = AddressType::SHIPPING;

        $this->address_service->update($payload);
    }

    protected function update_billing_address(Customer $customer, UpdateAddressPayloadDTO $data)
    {
        $is_billing_same_as_shipping = (bool) $data->is_billing_same_as_shipping;

        $this->customer_service->set_billing_same_as_shipping($customer->id, $is_billing_same_as_shipping);

        $billing_source = $is_billing_same_as_shipping
            ? $customer->shipping_address->to_array()
            : $data->all();

        $payload = UpdateAddressDTO::from_array($billing_source);
        $payload->id = $customer->billing_address->id;
        $payload->customer_id = $customer->id;
        $payload->type = AddressType::BILLING;

        $this->address_service->update($payload);
    }
}
