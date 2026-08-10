<?php

namespace Kirki\Ecommerce\App\Managers;

use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Actions\Order\CreateRefundAction;
use Kirki\Ecommerce\App\Actions\Order\UpdateOrderAction;
use Kirki\Ecommerce\App\Actions\Order\UpdateRefundAction;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\DTO\Refund\CreateRefundPayloadDTO;
use Kirki\Ecommerce\App\DTO\Refund\UpdateRefundPayloadDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

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
     * Mark an order fulfillment status as unfulfilled.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_unfulfilled(int $id)
    {
        return $this->order_service->partial_update_order($id, ['fulfillment_status' => FulfillmentStatus::UNFULFILLED]);
    }

    /**
     * Mark an order fulfillment status as pending.
     *
     * @param int $id
     * @param string|null $reason
     * @return bool
     */
    public function mark_as_cancel(int $id, $reason = null)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $is_cancelled = $this->order_service->apply_order_action($id, $order->order_status, OrderAction::CANCEL_ORDER);

        if ($is_cancelled) {
            $order->coupon_usage->delete();
            $this->inventory_service->release_all_reserved_stock($order);
            $this->order_service->partial_update_order($id, [
                'cancellation_reason' => $reason,
                'cancelled_at' => Date::now(),
            ]);
        }

        return $is_cancelled;
    }

    /**
     * Mark an order fulfillment status as processing.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_processing(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $action = $order->fulfillment_status === FulfillmentStatus::ON_HOLD
            ? OrderAction::RESUME_FULFILLMENT
            : OrderAction::MARK_AS_PROCESSING;

        return $this->order_service->apply_order_action($id, $order->order_status, $action);
    }

    /**
     * Mark an order fulfillment status as on hold.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_on_hold(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);

        return $this->order_service->apply_order_action($id, $order->order_status, OrderAction::MARK_AS_HOLD);
    }

    /**
     * Mark an order fulfillment status as shipped.
     */
    public function mark_as_shipped(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $is_shipped = $this->order_service->apply_order_action($id, $order->order_status, OrderAction::MARK_AS_SHIPPED);

        if ($is_shipped) {
            $this->order_service->partial_update_order($id, ['shipped_at' => Date::now()]);
        }

        return $is_shipped;
    }

    /**
     * Mark an order fulfillment status as delivered.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_delivered(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $is_delivered = $this->order_service->apply_order_action($id, $order->order_status, OrderAction::MARK_AS_DELIVERED);

        if ($is_delivered) {
            $this->order_service->partial_update_order($id, ['delivered_at' => Date::now()]);

            if ($order->payment_status === PaymentStatus::PAID) {
                $this->inventory_service->confirm_all_reserved_stock($order);
            }
        }

        return $is_delivered;
    }

    /**
     * Set the shipping carrier and tracking details of an order.
     *
     * @param int $id
     * @param array $tracking Accepts carrier, tracking_number and tracking_url keys.
     * @return bool
     */
    public function add_tracking(int $id, array $tracking)
    {
        return $this->order_service->partial_update_order($id, [
            'shipping_carrier' => $tracking['carrier'] ?? null,
            'shipping_tracking_number' => $tracking['tracking_number'] ?? null,
            'shipping_tracking_url' => $tracking['tracking_url'] ?? null,
        ]);
    }

    /**
     * Mark an order as archived.
     *
     * @param int $id
     * @return bool
     */
    public function mark_as_archive(int $id)
    {
        return $this->order_service->partial_update_order($id, ['archived_at' => Date::now()]);
    }

    /**
     * Mark an order as paid.
     *
     * @param int $id
     * @param string|null $payment_provider
     * @return bool
     */
    public function mark_payment_as_paid(int $id, ?string $payment_provider = null)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $is_paid = $this->order_service->apply_order_action($id, $order->order_status, OrderAction::MARK_AS_PAID);

        if ($is_paid) {
            $update = ['paid_at' => Date::now()];

            if (!empty($payment_provider)) {
                $update['payment_provider'] = $payment_provider;
            }

            $this->order_service->partial_update_order($id, $update);

            if ($order->fulfillment_status === FulfillmentStatus::DELIVERED) {
                $this->inventory_service->confirm_all_reserved_stock($order);
            }
        }

        return $is_paid;
    }

    /**
     * Mark an order is unpaid.
     *
     * @param int $id
     * @return bool
     */
    public function mark_payment_as_unpaid(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $order_status = OrderStatus::find_by_pair($order->fulfillment_status, PaymentStatus::UNPAID);

        return $this->order_service->partial_update_order($id, [
            'payment_status' => PaymentStatus::UNPAID,
            'order_status' => $order_status,
        ]);
    }

    /**
     * Mark an order is failed.
     *
     * @param int $id
     * @return bool
     */
    public function mark_payment_as_failed(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $order_status = OrderStatus::find_by_pair($order->fulfillment_status, PaymentStatus::FAILED);

        return $this->order_service->partial_update_order($id, [
            'payment_status' => PaymentStatus::FAILED,
            'order_status' => $order_status,
        ]);
    }

    /**
     * Mark an order as refunded.
     *
     * @param int $id
     * @return bool
     */
    public function mark_refund_as_completed(int $id)
    {
        $is_refunded = $this->order_service->mark_refund_as_completed($id);

        if ($is_refunded) {
            $this->inventory_service->release_all_reserved_stock(static::find($id));
        }

        return $is_refunded;
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
     * Set payment provider fee for an order, in both the order's invoiced
     * (transaction) currency and the store's base currency.
     *
     * @param int $id
     * @param int $fee Fee in the order's invoiced currency, minor units.
     * @return bool
     */
    public function set_payment_provider_fee(int $id, int $fee)
    {
        $order = $this->order_service->find_order($id);

        if (!$order) {
            return false;
        }

        return $this->order_service->partial_update_order($id, [
            'invoiced_payment_provider_fee' => $fee,
            'base_payment_provider_fee' => $this->convert_fee_to_base_currency($fee, $order),
        ]);
    }

    /**
     * Convert an invoiced-currency fee to the store's base currency, using
     * the order's own frozen exchange rate rather than a live rate.
     *
     * @param int $fee
     * @param Order $order
     * @return int
     */
    protected function convert_fee_to_base_currency(int $fee, Order $order)
    {
        if ($order->currency_code === $order->base_currency_code) {
            return $fee;
        }

        return Money::convert_to_currency(
            Money::from_minor($fee, $order->currency_code),
            $order->base_currency_code,
            1 / $order->exchange_rate
        )->getMinorAmount()->toInt();
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
     * Send the invoice email of an order to the customer.
     *
     * @param int $id
     * @return bool
     */
    public function send_invoice_email(int $id)
    {
        // @todo: implement once the order email layer exists. The plugin has no mailable,
        // template or renderer yet, only the EmailSettings option and SendEmailJob.
        return false;
    }

    /**
     * Send the customer a link to pay for an order.
     *
     * @param int $id
     * @return bool
     */
    public function send_payment_link(int $id)
    {
        // @todo: implement once the order email layer exists. The link itself comes from the
        // gateway's pay() method, but PaymentGateway::return_url() is still a stub.
        return false;
    }

    /**
     * Resend the order confirmation email to the customer.
     *
     * @param int $id
     * @return bool
     */
    public function resend_order_email(int $id)
    {
        // @todo: implement once the order email layer exists. SendNotificationEmail::handle()
        // is currently an empty listener and OrderShipped is never dispatched.
        return false;
    }
}
