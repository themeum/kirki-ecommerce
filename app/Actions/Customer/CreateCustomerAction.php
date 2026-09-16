<?php

namespace Kirki\Ecommerce\App\Actions\Customer;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;

class CreateCustomerAction
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
     * Create a new customer, optionally together with one or more addresses.
     *
     * The customer and any addresses are created in a single transaction.
     * If the customer or any address cannot be created, a Throwable is thrown.
     *
     * When addresses are supplied, the one marked (or falling back to the
     * first) as default shipping and the one marked (or falling back to the
     * first) as default billing are resolved independently - an address
     * winning both is persisted once, with both flags true.
     *
     * @param CreateCustomerDTO $customer_payload
     * @return Customer
     * @throws Throwable
     */
    public function execute(CreateCustomerDTO $customer_payload)
    {
        DB::begin_transaction();

        try {
            $customer_payload->user_id = $this->create_user($customer_payload);

            $customer = $this->customer_service->create($customer_payload);

            throw_if(empty($customer), __('Customer could not be created.', 'kirki-ecommerce'));

            foreach ($this->resolve_addresses($customer_payload->addresses) as $address_payload) {
                $address_payload->customer_id = $customer->id;

                $this->create_address($address_payload);
            }

            $customer = $this->customer_service->find($customer->id);

            DB::commit();

            return $customer;
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }

    /**
     * Resolve which supplied address is the default shipping address and
     * which is the default billing address, and set every address's flags
     * to match - forcing false on every non-winning address regardless of
     * what the caller submitted.
     *
     * @param CreateAddressDTO[] $addresses
     * @return CreateAddressDTO[]
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
     * @param CreateAddressDTO[] $addresses
     * @param string $flag
     * @return CreateAddressDTO|null
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

    protected function create_user(CreateCustomerDTO $customer)
    {
        if (!empty($customer->user_id)) {
            throw_if(empty(get_userdata($customer->user_id)), __('User could not be found.', 'kirki-ecommerce'));

            return $customer->user_id;
        }

        $new_user = [
            'user_login'    => $customer->email,
            'user_pass'     => wp_generate_password(12, true),
            'user_email'    => $customer->email,
            'first_name'    => $customer->first_name,
            'last_name'     => $customer->last_name,
            'role'          => 'subscriber',
        ];

        $user_id = wp_insert_user($new_user);

        if (is_wp_error($user_id)) {
            throw_anyway($user_id->get_error_message());
        }

        return $user_id;
    }

    protected function create_address(CreateAddressDTO $address_payload)
    {
        $is_created_billing_address = $this->address_service->create($address_payload);

        throw_if(!$is_created_billing_address, __('Customer address could not be created.', 'kirki-ecommerce'));

        return true;
    }
}
