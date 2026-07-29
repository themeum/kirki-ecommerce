<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;


class OrderRepository
{
    /**
     * Get paginated collections with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all orders with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Create a new order.
     *
     * @param array $data
     * @return Order
     */
    public function create_order(array $data)
    {
        $order = Order::create($data);

        return $this->find($order->id);
    }

    /**
     * Create a new order item.
     *
     * @param array $data
     * @return OrderItem
     */
    public function create_order_item(array $data)
    {
        $order_item = OrderItem::create($data);

        return $order_item;
    }

    /**
     * Update an order item.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update_order_item($id, array $data)
    {
        return OrderItem::find($id)->update($data);
    }

    /**
     * Delete an order item.
     *
     * @param int $id
     * @return bool
     */
    public function delete_order_item($id)
    {
        return OrderItem::find($id)->delete();
    }

    /**
     * Find an order by ID.
     *
     * @param int $id
     * @return Order|null
     */
    public function find($id)
    {
        return Order::with('items', 'refunds')->find($id);
    }

    /**
     * Find an order by UUID.
     *
     * @param string $uuid
     * @return Order|null
     */
    public function find_by_uuid($uuid)
    {
        return Order::with('items', 'refunds')->where('uuid', $uuid)->first();
    }

    /**
     * Find an order by transaction ID.
     *
     * @param string $transaction_id
     * @return Order|null
     */
    public function find_by_transaction_id($transaction_id)
    {
        return Order::with('items', 'refunds')->where('payment_transaction_id', $transaction_id)->first();
    }

    /**
     * Update an order.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, array $data)
    {
        return Order::find($id)->update($data);
    }

    /**
     * Update an order status by ID.
     *
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function update_order_status($id, $status)
    {
        return Order::find($id)->update(['order_status' => $status]);
    }

    /**
     * Update an order payment status by ID.
     *
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function update_payment_status($id, $status)
    {
        return Order::find($id)->update(['payment_status' => $status]);
    }

    /**
     * Delete an order by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        return Order::find($id)->delete();
    }

    /**
     * Bulk delete orders by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Order::where_in('id', $ids)->delete();
    }

    /**
     * Delete all orders.
     *
     * @param array $filters
     * @return bool
     */
    public function delete_all(array $filters = [])
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Get the query builder for the list of orders.
     *
     * @param array $filters
     * @return QueryBuilder
     */
    protected function list_query($filters = [])
    {
        return Order::when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
            return $query->where_any(['uuid', 'customer_name', 'customer_email'], 'like', '%' . $search . '%');
        })
            ->when(!empty($filters['customer_id']), function (QueryBuilder $query) use ($filters) {
                return $query->where('customer_id', $filters['customer_id']);
            })
            ->when(!empty($filters['start_date']), function (QueryBuilder $query) use ($filters) {
                return $query->where_date('created_at', '>=', $filters['start_date']);
            })
            ->when(!empty($filters['end_date']), function (QueryBuilder $query) use ($filters) {
                return $query->where_date('created_at', '<=', $filters['end_date']);
            })
            ->when(!empty($filters['status']), function (QueryBuilder $query) use ($filters) {
                return $query->where('status', $filters['status']);
            })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
