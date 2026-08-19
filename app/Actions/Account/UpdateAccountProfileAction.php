<?php

namespace Kirki\Ecommerce\App\Actions\Account;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Services\UserService;
use Kirki\Ecommerce\App\DTO\Account\UpdateProfileDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

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
     * Update the profile of the customer linked to the given WordPress user,
     * including their WordPress display name.
     *
     * @param int $user_id
     * @param UpdateProfileDTO $data
     * @param string $display_name
     * @return Customer
     * @throws NotFoundException
     * @throws Throwable
     */
    public function execute(int $user_id, UpdateProfileDTO $data, string $display_name)
    {
        $customer = $this->customer_service->find_by_user_id($user_id);

        if (empty($customer)) {
            throw new NotFoundException(__('Customer could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        DB::begin_transaction();

        try {
            $customer = $this->customer_service->update_profile($customer->id, $data);

            $this->user_service->update_display_name($user_id, $display_name);

            DB::commit();

            return $customer;
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
