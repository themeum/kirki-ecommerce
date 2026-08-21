<?php

namespace Kirki\Ecommerce\App\Actions\Account;

use Exception;
use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\App\DTO\Account\UpdateAddressPayloadDTO;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
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

        if (empty($customer)) {
            $customer = $this->customer_service->create(CreateCustomerDTO::from_array([
                'first_name' => $data->first_name,
                'last_name'  => $data->last_name,
                'email'      => $data->email,
                'user_id'    => $data->user_id,
            ]));
        }

        DB::begin_transaction();

        try {
            $address_data = $data->all();

            if ($data->type === AddressType::BILLING && $data->is_billing_same_as_shipping && !empty($customer->shipping_address)) {
                $this->customer_service->set_billing_same_as_shipping($customer->id, $data->is_billing_same_as_shipping);
                $address_data = $customer->shipping_address->to_array();
            }

            if ($data->type === AddressType::BILLING && $data->is_billing_same_as_shipping && empty($customer->shipping_address)) {
                throw new Exception(__('Shipping address is not set.', 'kirki-ecommerce'));
            }
                

            $this->update_address($customer, $address_data, $data->type);

            DB::commit();

            return $this->customer_service->find($customer->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }

    protected function update_address(Customer $customer, array $address_data, string $type)
    {
        if (empty($customer->{$type . '_address'})) {
            $payload = CreateAddressDTO::from_array($address_data);
            $payload->customer_id = $customer->id;
            $payload->type = $type;

            $this->address_service->create($payload);
        } else {
            $payload = UpdateAddressDTO::from_array($address_data);
            $payload->id = $customer->{$type . '_address'}->id;
            $payload->customer_id = $customer->id;
            $payload->type = $type;

            $this->address_service->update($payload);
        }
    }
}
