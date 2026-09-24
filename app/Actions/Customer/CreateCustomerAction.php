<?php

namespace Kirki\Ecommerce\App\Actions\Customer;

use Kirki\Ecommerce\App\Concerns\ResolvesAddressDefaults;
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
    use ResolvesAddressDefaults;

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
     * Resolve the WordPress user ID for the customer.
     *
     * Attaches to an existing WordPress user found by email when one exists,
     * regardless of whether a new one was also requested. Otherwise creates a
     * new subscriber user from the customer's name and email only when the
     * caller asked for one; when neither applies, the customer is left with
     * no linked WordPress user.
     *
     * @since 1.0.0
     *
     * @param CreateCustomerDTO $customer Customer payload.
     * @return int|null WordPress user ID, or null when no user is linked.
     * @throws \Exception When the given user ID does not exist or a requested new user cannot be inserted.
     */
    protected function create_user(CreateCustomerDTO $customer)
    {
        if (!empty($customer->user_id)) {
            throw_if(empty(get_userdata($customer->user_id)), __('User could not be found.', 'kirki-ecommerce'));

            return $customer->user_id;
        }

        $existing_user = get_user_by('email', $customer->email);

        if (!empty($existing_user)) {
            return $existing_user->ID;
        }

        if (empty($customer->create_wordpress_user)) {
            return null;
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
