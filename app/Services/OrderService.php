<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\OrderItemCoupon;
use Kirki\Ecommerce\App\Models\OrderTax;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\Order\OrderListFilterDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderCouponDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemCouponDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderTaxDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderItemDTO;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderListResource;
use Kirki\Ecommerce\App\Supports\OrderNumberGenerator;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Handles orders and their items, coupons and tax lines: querying, creating, updating and deleting.
 *
 * @since 1.0.0
 */
class OrderService
{
    use HasSortableColumns;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function sortable_columns()
    {
        return [
            'id' => 'id',
            'uuid' => 'uuid',
            'order_number' => 'order_number',
            'customer_id' => 'customer_id',
            'order_status' => 'order_status',
            'status' => 'order_status',
            'quantity' => 'items_count',
            'sub_total' => 'sub_total',
            'invoiced_total' => 'invoiced_total',
            'payment_provider' => 'payment_provider',
            'created_by' => 'created_by',
            'updated_by' => 'updated_by',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get all orders matching the filters, without pagination.
     *
     * @since 1.0.0
     *
     * @param OrderListFilterDTO $filter_dto Search, status, date and sorting filters.
     * @return Collection Collection of Order.
     */
    public function all_orders(OrderListFilterDTO $filter_dto)
    {
        return $this->list_query($filter_dto)->get();
    }

    /**
     * Get a page of the logged-in customer's orders for the account area.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>|null $filters Request filters for the order list.
     * @return array{orders: array, filters: array<string, mixed>|null} Paginated order list resource and the filters used.
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
     * Get a page of orders matching the filters, with their items loaded.
     *
     * @since 1.0.0
     *
     * @param OrderListFilterDTO $dto Search, status, date, sorting and pagination filters.
     * @return Paginator
     */
    public function paginated_orders(OrderListFilterDTO $dto)
    {
        return $this->list_query($dto)
            ->with('items')
            ->paginate($dto->limit ?? Pagination::LIMIT, $dto->page ?? 1);
    }

    /**
     * Create a new order and assign its order and invoice numbers.
     *
     * @since 1.0.0
     *
     * @param CreateOrderDTO $dto Order data.
     * @return Order|null The order reloaded with its relations.
     */
    public function create_order(CreateOrderDTO $dto)
    {
        $order = Order::create($dto->to_array());

        $order->update([
            'order_number' => OrderNumberGenerator::generate_order_number($order->id),
            'invoice_number' => OrderNumberGenerator::generate_invoice_number(),
        ]);

        return $this->find_order($order->id);
    }

    /**
     * Create a new order item.
     *
     * @since 1.0.0
     *
     * @param CreateOrderItemDTO $dto Order item data.
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
     * @since 1.0.0
     *
     * @param UpdateOrderItemDTO $dto Order item data, including its ID.
     * @return bool False when the item does not exist.
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
     * @since 1.0.0
     *
     * @param int $id Order item ID.
     * @return bool True when a row was deleted.
     */
    public function delete_order_item($id)
    {
        return (bool) OrderItem::query()->where('id', $id)->delete();
    }

    /**
     * Create an order-coupon attribution row.
     *
     * @since 1.0.0
     *
     * @param CreateOrderCouponDTO $dto Order coupon data.
     * @return OrderCoupon
     */
    public function create_order_coupon(CreateOrderCouponDTO $dto)
    {
        return OrderCoupon::create($dto->to_array());
    }

    /**
     * Create an order-item-coupon attribution row.
     *
     * @since 1.0.0
     *
     * @param CreateOrderItemCouponDTO $dto Order item coupon data.
     * @return OrderItemCoupon
     */
    public function create_order_item_coupon(CreateOrderItemCouponDTO $dto)
    {
        return OrderItemCoupon::create($dto->to_array());
    }

    /**
     * Delete every coupon attribution row for an order.
     *
     * Cascades to their order_item_coupon rows, so they can be recreated from a
     * fresh calculation.
     *
     * @since 1.0.0
     *
     * @param int $order_id Order ID.
     * @return bool True when rows were deleted.
     */
    public function delete_order_coupons(int $order_id)
    {
        return (bool) OrderCoupon::query()->where('order_id', $order_id)->delete();
    }

    /**
     * Create one order tax line, scoped to an order item or to the order's shipping.
     *
     * @since 1.0.0
     *
     * @param CreateOrderTaxDTO $dto Order tax data.
     * @return OrderTax
     */
    public function create_order_tax(CreateOrderTaxDTO $dto)
    {
        return OrderTax::create($dto->to_array());
    }

    /**
     * Delete every tax line for an order, so they can be recreated from a fresh calculation.
     *
     * @since 1.0.0
     *
     * @param int $order_id Order ID.
     * @return bool True when rows were deleted.
     */
    public function delete_order_taxes(int $order_id)
    {
        return (bool) OrderTax::query()->where('order_id', $order_id)->delete();
    }

    /**
     * Find an order by UUID, with its items, taxes, refunds and coupons loaded.
     *
     * @since 1.0.0
     *
     * @param string $uuid Order UUID.
     * @return Order|null
     */
    public function find_order_by_uuid($uuid)
    {
        return Order::with('items.taxes', 'refunds', 'order_coupons.order_item_coupons', 'shipping_taxes')->where('uuid', $uuid)->first();
    }

    /**
     * Find an order by its payment transaction ID, with its items and refunds loaded.
     *
     * @since 1.0.0
     *
     * @param string $transaction_id Payment gateway transaction ID.
     * @return Order|null
     */
    public function find_order_by_transaction_id($transaction_id)
    {
        return Order::with('items', 'refunds')->where('payment_transaction_id', $transaction_id)->first();
    }

    /**
     * Find an order by ID, with its items, taxes, refunds and coupons loaded.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return Order|null
     */
    public function find_order($id)
    {
        return Order::with('items.taxes', 'refunds', 'order_coupons.order_item_coupons', 'shipping_taxes')->find($id);
    }

    /**
     * Find an order by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return Order
     * @throws NotFoundException When the order does not exist.
     */
    public function find_order_or_fail($id)
    {
        $order = $this->find_order($id);

        throw_if(!$order, __('Order not found.', 'kirki-ecommerce'), NotFoundException::class);

        return $order;
    }

    /**
     * Update an order by ID.
     *
     * @since 1.0.0
     *
     * @param UpdateOrderDTO $dto Order data, including its ID.
     * @return bool False when the order does not exist.
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
     * Update only the given fields of an order.
     *
     * @since 1.0.0
     *
     * @param int                  $id   Order ID.
     * @param array<string, mixed> $data Column values to update.
     * @return bool False when the order does not exist.
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
     * Apply an order action's transition.
     *
     * Persists order_status, fulfillment_status and payment_status together from
     * the order state matrix. If the action has no transition entry for the
     * order's current status, it is a side-effect only action and no status
     * fields are changed.
     *
     * @since 1.0.0
     *
     * @param int    $id                  Order ID.
     * @param string $order_status_before Order status before the action.
     * @param string $action              Action being applied.
     * @return bool True when the transition was applied or the action needs none.
     * @throws NotFoundException When the order does not exist or could not be updated.
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

        throw_if(empty($order), __('Order not found.', 'kirki-ecommerce'), NotFoundException::class);

        $is_updated = (bool) $order->update([
            'order_status' => $target_status,
            'fulfillment_status' => $target_state['fulfillment_status'],
            'payment_status' => $target_state['payment_status'],
        ]);

        throw_if(!$is_updated, __('Order not found.', 'kirki-ecommerce'), NotFoundException::class);

        return $is_updated;
    }

    /**
     * Mark an order's refund as completed.
     *
     * Sets the order to refunded and returned, but only when a refund was initiated.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool False when the order does not exist or has no initiated refund.
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
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when a row was deleted.
     */
    public function delete_order($id)
    {
        return (bool) Order::query()->where('id', $id)->delete();
    }

    /**
     * Delete an order by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool
     * @throws NotFoundException When no order was deleted.
     */
    public function delete_order_or_fail($id)
    {
        $result = $this->delete_order($id);

        throw_if(!$result, __('Order not found.', 'kirki-ecommerce'), NotFoundException::class);

        return $result;
    }

    /**
     * Delete multiple orders by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids IDs of the orders to delete.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no IDs are given or no order was deleted.
     */
    public function bulk_delete(array $ids)
    {
        throw_if(empty($ids), __('No orders selected.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $is_deleted = (bool) Order::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Orders could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete all orders matching the filters.
     *
     * @since 1.0.0
     *
     * @param OrderListFilterDTO $filters Search, status and date filters selecting the orders.
     * @return bool True when rows were deleted.
     */
    public function delete_all(OrderListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the filtered and sorted query for the list of orders.
     *
     * @since 1.0.0
     *
     * @param OrderListFilterDTO $filters Search, status, date and sorting filters.
     * @return QueryBuilder
     */
    protected function list_query(OrderListFilterDTO $filters)
    {
        $query = Order::when($filters->search, function (QueryBuilder $query, $search) {
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
                return $query->apply_status_filter($filters->status);
            })
            ->when(!empty($filters->fulfillment_status), function (QueryBuilder $query) use ($filters) {
                return $query->where('fulfillment_status', $filters->fulfillment_status);
            })
            ->when(!empty($filters->payment_status), function (QueryBuilder $query) use ($filters) {
                return $query->where('payment_status', $filters->payment_status);
            })
            ->when(!empty($filters->shipping_method), function (QueryBuilder $query) use ($filters) {
                return $query->where('shipping_method', $filters->shipping_method);
            });

        return $this->apply_sorting($query, $filters);
    }

    /**
     * Get guest orders placed with an email address.
     *
     * @since 1.0.0
     *
     * @param string $email Email address.
     * @return Collection<Order> Orders that have no customer assigned.
     */
    public function get_guest_orders_by_email($email)
    {
        return Order::where_null('customer_id')
            ->where('customer_email', $email)
            ->get();
    }

    /**
     * Assign a user's matching guest orders to their customer account.
     *
     * Creates the customer record if the user has none yet.
     *
     * @since 1.0.0
     *
     * @param int $user_id WordPress user ID.
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
            $dto->last_name = $user->get_last_name();
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
