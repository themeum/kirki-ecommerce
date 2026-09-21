<?php

namespace Kirki\Ecommerce\App\Actions\Account;

use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Services\UserService;
use Kirki\Ecommerce\App\DTO\Account\UpdateProfilePayloadDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;
use function Kirki\Ecommerce\Framework\user;

/**
 * Updates a logged-in account's customer profile and WordPress user in one transaction.
 *
 * @since 1.0.0
 */
class UpdateAccountProfileAction
{
    /** @var CustomerService */
    protected $customer_service;

    /** @var UserService */
    protected $user_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CustomerService $customer_service Customer lookup and update service.
     * @param UserService     $user_service     WordPress user update service.
     */
    public function __construct(CustomerService $customer_service, UserService $user_service)
    {
        $this->customer_service = $customer_service;
        $this->user_service = $user_service;
    }

    /**
     * Update the profile of the customer linked to the WordPress user in the
     * payload, including their WordPress display name.
     *
     * Creates the Customer record first when the user has none. The customer
     * and WordPress user updates run in a single transaction.
     *
     * @since 1.0.0
     *
     * @param UpdateProfilePayloadDTO $data Profile payload including the WordPress user ID.
     * @return Customer The updated customer.
     * @throws Throwable When either update fails; the transaction is rolled back.
     */
    public function execute(UpdateProfilePayloadDTO $data)
    {
        $customer = $this->customer_service->find_by_user_id($data->user_id);

        if (empty($customer)) {
            $user = user($data->user_id);

            $customer = $this->customer_service->create(CreateCustomerDTO::from_array([
                'first_name' => $data->first_name,
                'last_name'  => $data->last_name,
                'email'      => $user->get_email(),
                'user_id'    => $data->user_id,
            ]));
        }

        DB::begin_transaction();

        try {
            $customer = $this->customer_service->update_profile($customer->id, $data->all());

            $this->user_service->partial_update($data->user_id, $data->all());

            DB::commit();

            return $customer;
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
