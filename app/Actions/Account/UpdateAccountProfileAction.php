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

class UpdateAccountProfileAction
{
    protected $customer_service;
    protected $user_service;

    public function __construct(CustomerService $customer_service, UserService $user_service)
    {
        $this->customer_service = $customer_service;
        $this->user_service = $user_service;
    }

    /**
     * Update the profile of the customer linked to the WordPress user in the
     * payload, including their WordPress display name.
     *
     * @param UpdateProfilePayloadDTO $data
     * @return Customer
     * @throws NotFoundException
     * @throws Throwable
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
