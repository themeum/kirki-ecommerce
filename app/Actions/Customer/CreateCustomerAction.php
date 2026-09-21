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

/**
 * Creates a customer with its WordPress user and optional addresses in one transaction.
 *
 * @since 1.0.0
 */
class CreateCustomerAction
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
     * @since 1.0.0
     *
     * @param CreateCustomerDTO $customer_payload Customer data, including user ID and addresses.
     * @return Customer The created customer with its relations loaded.
     * @throws Throwable When the user, customer or an address cannot be created; the transaction is rolled back.
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
     * @since 1.0.0
     *
     * @param CreateAddressDTO[] $addresses Addresses submitted with the customer.
     * @return CreateAddressDTO[] The same addresses with default flags resolved; empty when none were supplied.
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
     * @param CreateAddressDTO[] $addresses Addresses to search.
     * @param string             $flag      Address property to test, e.g. is_default_shipping.
     * @return CreateAddressDTO|null Null when no address has the flag set.
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

    /**
     * Resolve the WordPress user ID for the customer.
     *
     * Verifies the given user exists, otherwise inserts a new subscriber
     * user from the customer's name and email.
     *
     * @since 1.0.0
     *
     * @param CreateCustomerDTO $customer Customer payload.
     * @return int WordPress user ID.
     * @throws \Exception When the given user does not exist or the new user cannot be inserted.
     */
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

    /**
     * Persist an address for the customer.
     *
     * @since 1.0.0
     *
     * @param CreateAddressDTO $address_payload Address data with customer_id set.
     * @return bool Always true; failure to create the address is thrown instead.
     * @throws \Exception When the address cannot be created.
     */
    protected function create_address(CreateAddressDTO $address_payload)
    {
        $is_created_billing_address = $this->address_service->create($address_payload);

        throw_if(!$is_created_billing_address, __('Customer address could not be created.', 'kirki-ecommerce'));

        return true;
    }
}
