<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\Order\OrderListFilterDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderItemDTO;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderListResource;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\user;

class OrderService
{
    /**
     * Get all orders with optional search and sorting.
     *
     * @param OrderListFilterDTO $filter_dto
     * @return Collection
     */
    public function all_orders(OrderListFilterDTO $filter_dto)
    {
        return $this->list_query($filter_dto)->get();
    }

    /**
     * Get account orders.
     *
     * @since 1.0.0
     *
     * @param array $filters filters.
     *
     * @return array
     */
    public function get_current_customer_orders($filters)
    {
        $dto = OrderListFilterDTO::from_array($filters ?? []);
        $dto->customer_id = (int) customer()->get_customer_id();

        $orders = $this->paginated_orders($dto);
        $orders_resource = OrderListResource::paginated($orders);

        return [
            'orders' => $orders_resource,
            'filters' => $filters,
        ];
    }


    /**
     * Return paginated brands
     *
     * @param OrderListFilterDTO $dto
     * @return Paginator
     */
    public function paginated_orders(OrderListFilterDTO $dto)
    {
        return $this->list_query($dto)
            ->with('items')
            ->paginate($dto->limit ?? Pagination::LIMIT, $dto->page ?? 1);
    }

    /**
     * Create a new order.
     *
     * @param CreateOrderDTO $dto
     * @return Order
     */
    public function create_order(CreateOrderDTO $dto)
    {
        $order = Order::create($dto->to_array());

        return $this->find_order($order->id);
    }

    /**
     * Create a new order item.
     *
     * @param CreateOrderItemDTO $dto
     * @return OrderItem
     */
    public function create_order_item(CreateOrderItemDTO $dto)
    {
        $order_item = OrderItem::create($dto->to_array());
        return $order_item;
    }

    /**
     * Update an order item by ID.
     *
     * @param UpdateOrderItemDTO $dto
     * @return bool
     */
    public function update_order_item(UpdateOrderItemDTO $dto)
    {
        $order_item = OrderItem::find($dto->id);

        if (empty($order_item)) {
            return false;
        }

        return (bool) $order_item->update($dto->to_array());
    }

    /**
     * Delete an order item by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete_order_item($id)
    {
        return (bool) OrderItem::query()->where('id', $id)->delete();
    }

    /**
     * Find an order by UUID.
     *
     * @param string $uuid
     * @return Order|null
     */
    public function find_order_by_uuid($uuid)
    {
        return Order::with('items', 'refunds')->where('uuid', $uuid)->first();
    }

    /**
     * Find an order by transaction ID.
     *
     * @param string $transaction_id
     * @return Order|null
     */
    public function find_order_by_transaction_id($transaction_id)
    {
        return Order::with('items', 'refunds')->where('payment_transaction_id', $transaction_id)->first();
    }

    /**
     * Find an order by ID.
     *
     * @param int $id
     * @return Order|null
     */
    public function find_order($id)
    {
        return Order::with('items', 'refunds')->find($id);
    }

    /**
     * Find an order by ID or throw an exception.
     *
     * @param int $id
     * @return Order
     *
     * @throws NotFoundException
     */
    public function find_order_or_fail($id)
    {
        $order = $this->find_order($id);

        if (!$order) {
            throw new NotFoundException(__('Order not found.', 'kirki-ecommerce'));
        }

        return $order;
    }

    /**
     * Update an order by ID.
     *
     * @param UpdateOrderDTO $dto
     * @return bool
     */
    public function update_order(UpdateOrderDTO $dto)
    {
        $order = Order::find($dto->id);

        if (empty($order)) {
            return false;
        }

        return (bool) $order->update($dto->to_array());
    }

    /**
     * Partial update an order by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function partial_update_order(int $id, array $data)
    {
        $order = Order::find($id);

        if (empty($order)) {
            return false;
        }

        return (bool) $order->update($data);
    }

    /**
     * Apply an order action's transition, persisting order_status, fulfillment_status and
     * payment_status together from the order state matrix.
     *
     * If the action has no transition entry for the order's current status, it is a
     * side-effect only action and no status fields are changed.
     *
     * @param int $id
     * @param string $order_status_before
     * @param string $action
     * @return bool
     */
    public function apply_order_action(int $id, string $order_status_before, string $action)
    {
        $current_state = OrderStatus::get_state($order_status_before);
        $target_status = $current_state['transitions'][$action] ?? null;

        if (empty($target_status)) {
            return true;
        }

        $target_state = OrderStatus::get_state($target_status);

        $order = Order::find($id);

        if (empty($order)) {
            throw new NotFoundException(__('Order not found.', 'kirki-ecommerce'));
        }

        $is_updated = (bool) $order->update([
            'order_status' => $target_status,
            'fulfillment_status' => $target_state['fulfillment_status'],
            'payment_status' => $target_state['payment_status'],
        ]);

        if (!$is_updated) {
            throw new NotFoundException(__('Order not found.', 'kirki-ecommerce'));
        }

        return $is_updated;
    }

    /**
     * Mark a refund as completed.
     *
     * @param int $id
     * @return bool
     */
    public function mark_refund_as_completed(int $id)
    {
        $order = Order::find($id);

        if (empty($order) || !$order->is_refund_initiated) {
            return false;
        }

        return (bool) $order->update([
            'payment_status' => PaymentStatus::REFUNDED,
            'fulfillment_status' => FulfillmentStatus::RETURNED,
            'order_status' => OrderStatus::REFUNDED,
        ]);
    }

    /**
     * Delete an order by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete_order($id)
    {
        return (bool) Order::query()->where('id', $id)->delete();
    }

    /**
     * Delete an order by ID or throw an exception.
     *
     * @param int $id
     * @return bool
     *
     * @throws NotFoundException
     */
    public function delete_order_or_fail($id)
    {
        $result = $this->delete_order($id);

        if (!$result) {
            throw new NotFoundException(__('Order not found.', 'kirki-ecommerce'));
        }

        return $result;
    }

    /**
     * Deletes multiple orders by their IDs.
     *
     * @param array $ids The IDs of the orders to delete.
     * @return bool True if the orders were deleted successfully, false otherwise.
     * @throws NotFoundException If the orders could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No orders selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = (bool) Order::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Orders could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all orders.
     *
     * @param OrderListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(OrderListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Get the query builder for the list of orders.
     *
     * @param OrderListFilterDTO $filters
     * @return QueryBuilder
     */
    protected function list_query(OrderListFilterDTO $filters)
    {
        return Order::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where_any(
                ['order_number', 'customer_email', 'shipping_first_name', 'shipping_last_name'],
                'like',
                '%' . $search . '%'
            );
        })
            ->when(is_numeric($filters->customer_id), function (QueryBuilder $query) use ($filters) {
                return $query->where('customer_id', $filters->customer_id);
            })
            ->filter_with_datetime_range($filters->from_date, $filters->to_date)
            ->when(!empty($filters->status), function (QueryBuilder $query) use ($filters) {
                return $query->where('order_status', $filters->status);
            })
            ->when(!empty($filters->fulfillment_status), function (QueryBuilder $query) use ($filters) {
                return $query->where('fulfillment_status', $filters->fulfillment_status);
            })
            ->when(!empty($filters->payment_status), function (QueryBuilder $query) use ($filters) {
                return $query->where('payment_status', $filters->payment_status);
            })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }

    /**
     * Get guest orders by email.
     *
     * @since 1.0.0
     *
     * @param string $email Email address.
     *
     * @return Collection<Order>
     */
    public function get_guest_orders_by_email($email)
    {
        return Order::where_null('customer_id')
            ->where('customer_email', $email)
            ->get();
    }

    /**
     * Merge guest orders into customer account.
     *
     * @since 1.0.0
     *
     * @param int $user_id
     *
     * @return void
     */
    public function merge_guest_orders($user_id)
    {
        $user = user($user_id);
        if (!$user) {
            return;
        }

        $customer_service = app(CustomerService::class);
        $customer = $customer_service->find_by_user_id($user_id);
        if (!$customer) {
            $dto = new CreateCustomerDTO();
            $dto->user_id = $user_id;
            $dto->first_name = $user->get_first_name();
            $dto->last_name = $user->get_first_name();
            $dto->email = $user->get_email();
            $customer = $customer_service->create($dto);
        }

        if ($customer) {
            $guest_orders = $this->get_guest_orders_by_email($user->get_email());
            $order_ids = $guest_orders->pluck('id')->to_array();
            if (!empty($order_ids)) {
                Order::where_in('id', $order_ids)->update([
                'customer_id' => $customer->id,
                ]);
            }
        }
    }
}
