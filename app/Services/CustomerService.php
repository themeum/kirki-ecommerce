<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Repositories\CustomerRepository;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\DTO\Customer\UpdateCustomerDTO;
use Kirki\Ecommerce\Exceptions\NotFoundException;
use Kirki\Ecommerce\Http\Response;
use Kirki\Ecommerce\Supports\Facades\DB;
use Exception;

use function Kirki\Ecommerce\user;

class CustomerService
{
    protected $repository;

    public function __construct(CustomerRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Return paginated customers
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all customers
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
    }

    /**
     * Find a customer by ID.
     *
     * @param int $id
     * @return Customer
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $customer = $this->repository->find($id);

        if (empty($customer)) {
            throw new NotFoundException(__('Customer not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $customer;
    }

    /**
     * Find a customer by their user ID.
     *
     * @param int $id
     * @return Customer|null
     */
    public function find_by_user_id(int $user_id)
    {
        $customer = $this->repository->find_by_user_id($user_id);

        return $customer;
    }

    /**
     * Create a new customer.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateCustomerDTO $data
     * @return Customer
     */
    public function create(CreateCustomerDTO $data)
    {
        if (!empty($data->user_id) && $this->find_by_user_id($data->user_id)) {
            throw new Exception(__('Customer already exists', 'kirki-ecommerce'));
        }

        $data_array = $data->all();

        $data_array['created_by'] = user()->get_id();
        $data_array['updated_by'] = user()->get_id();

        return $this->repository->create($data_array);
    }

    /**
     * Updates a customer.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateCustomerDTO $data
     * @throws NotFoundException
     * @return Customer
     */
    public function update(UpdateCustomerDTO $data)
    {
        // var_dump($data);die();
        $customer = $this->repository->find($data->id);

        if (empty($customer)) {
            throw new NotFoundException(__('Customer could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data_array = $data->all();
        $data_array['updated_by'] = user()->get_id();

        $is_updated = $this->repository->update($data->id, $data_array);

        if (!$is_updated) {
            throw new NotFoundException(__('Customer could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        if (!empty($data->user_id) && $this->find_by_user_id($customer->user_id)) {
            wp_update_user([
                'ID' => $customer->user_id,
                'user_email' => $data->email
            ]);
        }

        return $this->find($data->id);
    }

    /**
     * Deletes a customer by ID.
     *
     * @param int $id The ID of the customer to delete.
     * @return bool True if the customer was deleted successfully, false otherwise.
     * @throws NotFoundException If the customer could not be found or deleted.
     */
    public function delete(int $id)
    {
        $customer = $this->repository->find($id);

        if (empty($customer)) {
            throw new NotFoundException(__('Customer could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new NotFoundException(__('Customer could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        if (!function_exists('wp_delete_user')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }

        wp_delete_user($customer->user_id);

        return true;
    }

    /**
     * Deletes multiple customers by their IDs.
     *
     * @param array $ids The IDs of the customers to delete.
     * @return bool True if the customers were deleted successfully, false otherwise.
     * @throws NotFoundException If the customers could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $user_ids = $this->repository->get_user_ids_by_customer_ids($ids);
        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new NotFoundException(__('Customers could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        if (!function_exists('wp_delete_user')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }

        foreach ($user_ids as $user_id) {
            wp_delete_user($user_id);
        }

        return true;
    }

    /**
     * Deletes all customers.
     *
     * @param ListFilterDTO $filters
     * @return bool True if successfully
     * @throws Exception If the customers could not be deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        DB::begin_transaction();

        try {
            $this->all($filters)->each(function ($customer) {
                if (!function_exists('wp_delete_user')) {
                    require_once ABSPATH . 'wp-admin/includes/user.php';
                }

                wp_delete_user($customer->user_id);
            });

            $is_deleted = (bool) $this->repository->delete_all($filters->to_array());

            DB::commit();

            return $is_deleted;
        } catch (Exception $e) {
            DB::roll_back();
            throw $e;
        }
    }
}
