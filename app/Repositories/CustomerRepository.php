<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

class CustomerRepository
{
    /**
     * Get paginated customers with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }


    /**
     * Find a customer by ID.
     *
     * @param int $id
     * @return Customer|null
     */
    public function find(int $id)
    {
        return Customer::with('billing_address', 'shipping_address')->find($id);
    }

    /**
     * Find a customer by user ID.
     *
     * @param int $user_id
     * @return Customer|null
     */
    public function find_by_user_id(int $user_id)
    {
        return Customer::with('billing_address', 'shipping_address')->where('user_id', $user_id)->first();
    }

    /**
     * Get user IDs by customer IDs.
     *
     * @param array $customer_ids
     * @return array
     */
    public function get_user_ids_by_customer_ids(array $customer_ids)
    {
        return Customer::where_in('id', $customer_ids)->get()->pluck('user_id')->all();
    }

    /**
     * Create a new customer.
     *
     * @param array $data
     * @return Customer
     */
    public function create(array $data)
    {
        return Customer::create($data)->load('addresses');
    }

    /**
     * Update a customer by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        return (bool) Customer::find($id)->update($data);
    }

    /**
     * Delete a customer by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Customer::find($id)->delete();
    }

    /**
     * Bulk delete customers by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Customer::where_in('id', $ids)->delete();
    }

    /**
     * Delete all customers.
     *
     * @param array $filters
     * @return bool
     */
    public function delete_all(array $filters = [])
    {
        return (bool) $this->list_query($filters)->delete();
    }

    protected function list_query($filters = [])
    {
        return Customer::query()
            ->with_max('orders', 'created_at')
            ->with_count('orders')
            ->with_sum(['orders' => fn($query) => $query->where('payment_status', PaymentStatus::PAID)], 'base_total')
            ->with('billing_address', 'shipping_address')
            ->when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
                return $query->where_any(['first_name', 'last_name', 'email', 'phone'], 'like', '%' . $search . '%');
            })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
