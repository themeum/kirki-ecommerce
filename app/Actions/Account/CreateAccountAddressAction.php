<?php

namespace Kirki\Ecommerce\App\Actions\Account;

use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\CustomerService;

class CreateAccountAddressAction
{
    protected $customer_service;
    protected $address_service;

    public function __construct(CustomerService $customer_service, AddressService $address_service)
    {
        $this->customer_service = $customer_service;
        $this->address_service = $address_service;
    }

    /**
     * Create an address for the customer linked to the given WordPress user,
     * provisioning a Customer record first if one doesn't exist yet.
     *
     * The Customer record's name/email/phone are sourced from the WordPress
     * user profile first, falling back to the submitted address - the
     * address itself may have no email/phone, but customers.email is not
     * nullable, so the customer record can't rely on the address alone.
     *
     * @param CreateAddressDTO $data
     * @param int $user_id
     * @return Address
     */
    public function execute(CreateAddressDTO $data, int $user_id)
    {
        $customer = $this->customer_service->find_by_user_id($user_id);

        if (empty($customer)) {
            $wp_user = get_userdata($user_id) ?: null;

            $customer = $this->customer_service->create(CreateCustomerDTO::from_array([
                'first_name' => !empty($wp_user->first_name) ? $wp_user->first_name : $data->first_name,
                'last_name'  => !empty($wp_user->last_name) ? $wp_user->last_name : $data->last_name,
                'email'      => !empty($wp_user->user_email) ? $wp_user->user_email : $data->email,
                'user_id'    => $user_id,
            ]));
        }

        $data->customer_id = $customer->id;

        return $this->address_service->create($data);
    }
}
