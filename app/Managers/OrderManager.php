<?php

namespace Kirki\Ecommerce\App\Managers;

use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Actions\Order\CreateRefundAction;
use Kirki\Ecommerce\App\Actions\Order\UpdateOrderAction;
use Kirki\Ecommerce\App\Actions\Order\UpdateRefundAction;
use Kirki\Ecommerce\App\DTO\Refund\CreateRefundPayloadDTO;
use Kirki\Ecommerce\App\DTO\Refund\UpdateRefundPayloadDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO;

/**
 * OrderManager class
 * 
 * A collaborator class that provides convenient methods for order operations.
 * This manager delegates to order action classes and the order service.
 */
class OrderManager
{
    protected $create_order_action;
    protected $update_order_action;
    protected $order_service;
    protected $inventory_service;
    protected $create_refund_action;
    protected $update_refund_action;

    public function __construct(
        CreateOrderAction $create_order_action,
        UpdateOrderAction $update_order_action,
        OrderService $order_service,
        InventoryService $inventory_service,
        CreateRefundAction $create_refund_action,
        UpdateRefundAction $update_refund_action
    ) {
        $this->create_order_action = $create_order_action;
        $this->update_order_action = $update_order_action;
        $this->order_service = $order_service;
        $this->inventory_service = $inventory_service;
        $this->create_refund_action = $create_refund_action;
        $this->update_refund_action = $update_refund_action;
    }

    /**
     * Create a new order.
     *
     * @param CreateOrderPayloadDTO $dto
     * @return Order
     */
    public function create(CreateOrderPayloadDTO $dto)
    {
        return $this->create_order_action->execute($dto);
    }

    /**
     * Update an existing order.
     *
     * @param UpdateOrderPayloadDTO $dto
     * @return Order
     */
    public function update(UpdateOrderPayloadDTO $dto)
    {
        return $this->update_order_action->execute($dto);
    }

    /**
     * Mark an order as completed.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_completed(int $id)
    {
        $is_completed = $this->order_service->update_order_status($id, OrderStatus::COMPLETED);

        if ($is_completed) {
            $this->inventory_service->confirm_all_reserved_stock(static::find($id));
        }

        return $is_completed;
    }

    /**
     * Mark an order as cancelled.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_cancelled(int $id)
    {
        $is_cancelled = $this->order_service->update_order_status($id, OrderStatus::CANCELLED);

        if ($is_cancelled) {
            $this->inventory_service->release_all_reserved_stock(static::find($id));
        }

        return $is_cancelled;
    }

    /**
     * Mark an order as refunded.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_refunded(int $id)
    {
        $is_refunded = $this->order_service->update_order_status($id, OrderStatus::REFUNDED);

        if ($is_refunded) {
            $this->inventory_service->release_all_reserved_stock(static::find($id));
        }

        return $is_refunded;
    }

    /**
     * Mark an order as pending.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_pending(int $id)
    {
        return $this->order_service->update_order_status($id, OrderStatus::PENDING);
    }

    /**
     * Mark an order as processing.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_processing(int $id)
    {
        return $this->order_service->update_order_status($id, OrderStatus::PROCESSING);
    }

    /**
     * Mark an order as on hold.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_on_hold(int $id)
    {
        return $this->order_service->update_order_status($id, OrderStatus::ON_HOLD);
    }

    /**
     * Update an order's payment status.
     *
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function update_payment_status(int $id, string $status)
    {
        return $this->order_service->update_payment_status($id, $status);
    }

    /**
     * Mark an order as paid.
     *
     * @param int $id
     * @return bool
     */
    public function mark_payment_as_paid(int $id)
    {
        return $this->order_service->update_payment_status($id, PaymentStatus::PAID);
    }

    /**
     * Mark an order as refunded.
     *
     * @param int $id
     * @return bool
     */
    public function mark_payment_as_failed(int $id)
    {
        return $this->order_service->update_payment_status($id, PaymentStatus::FAILED);
    }

    /**
     * Mark an order as refunded.
     *
     * @param int $id
     * @return bool
     */
    public function mark_payment_as_refunded(int $id)
    {
        return $this->order_service->update_payment_status($id, PaymentStatus::REFUNDED);
    }

    /**
     * Mark an order as pending.
     *
     * @param int $id
     * @return bool
     */
    public function mark_payment_as_pending(int $id)
    {
        return $this->order_service->update_payment_status($id, PaymentStatus::PENDING);
    }

    /**
     * Mark an order as processing.
     *
     * @param int $id
     * @return bool
     */
    public function mark_payment_as_processing(int $id)
    {
        return $this->order_service->update_payment_status($id, PaymentStatus::PROCESSING);
    }

    /**
     * Mark an order as on hold.
     *
     * @param int $id
     * @return bool
     */
    public function mark_payment_as_on_hold(int $id)
    {
        return $this->order_service->update_payment_status($id, PaymentStatus::ON_HOLD);
    }

    /**
     * Find an order by ID.
     *
     * @param int $id
     * @return Order|null
     */
    public function find(int $id)
    {
        return $this->order_service->find_order($id);
    }

    /**
     * Find an order by ID or throw an exception.
     *
     * @param int $id
     * @return Order
     * @throws \Kirki\Ecommerce\Framework\Exceptions\NotFoundException
     */
    public function find_or_fail(int $id)
    {
        return $this->order_service->find_order_or_fail($id);
    }

    /**
     * Find an order by UUID.
     *
     * @param string $uuid
     * @return Order|null
     */
    public function find_by_uuid(string $uuid)
    {
        return $this->order_service->find_order_by_uuid($uuid);
    }

    /**
     * Find an order by transaction ID.
     *
     * @param string $transaction_id
     * @return Order|null
     */
    public function find_by_transaction_id(string $transaction_id)
    {
        return $this->order_service->find_order_by_transaction_id($transaction_id);
    }

    /**
     * Delete an order by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return $this->order_service->delete_order($id);
    }

    /**
     * Delete an order by ID or throw an exception.
     *
     * @param int $id
     * @return bool
     * @throws \Kirki\Ecommerce\Framework\Exceptions\NotFoundException
     */
    public function delete_or_fail(int $id)
    {
        return $this->order_service->delete_order_or_fail($id);
    }

    /**
     * Set transaction id for an order.
     *
     * @param int $id
     * @param string $transaction_id
     * @return bool
     */
    public function set_transaction_id(int $id, string $transaction_id)
    {
        return $this->order_service->partial_update_order($id, ['payment_transaction_id' => $transaction_id]);
    }

    /**
     * Set payment gateway fee for an order.
     *
     * @param int $id
     * @param int $fee
     * @return bool
     */
    public function set_payment_gateway_fee(int $id, int $fee)
    {
        return $this->order_service->partial_update_order($id, ['payment_gateway_fee' => $fee]);
    }

    /**
     * Create a refund for an order.
     *
     * @param CreateRefundPayloadDTO $dto
     * @return Order
     */
    public function create_refund(CreateRefundPayloadDTO $dto)
    {
        return $this->create_refund_action->execute($dto);
    }

    /**
     * Update a refund for an order.
     *
     * @param UpdateRefundPayloadDTO $dto
     * @return Order
     */
    public function update_refund(UpdateRefundPayloadDTO $dto)
    {
        return $this->update_refund_action->execute($dto);
    }

    /**
     * Get a refund of an order.
     *
     * @param Order $order
     * @param int $id
     * @return Order
     */
    public function get_refund(Order $order, int $id)
    {
        return $order->refunds->filter(fn($refund) => (int) $refund->id === (int) $id)->values()->first();
    }

    /**
     * Set payment metadata for an order.
     *
     * @param int $id
     * @param array $payment_metadata
     * @return bool
     */
    public function set_payment_metadata(int $id, array $payment_metadata)
    {
        return $this->order_service->partial_update_order($id, [ 'payment_metadata' => $payment_metadata]);
    }
}
