<?php

namespace Kirki\Ecommerce\App\Managers;

use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Actions\Order\CreateRefundAction;
use Kirki\Ecommerce\App\Actions\Order\UpdateOrderAction;
use Kirki\Ecommerce\App\Actions\Order\UpdateRefundAction;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\DTO\Refund\CreateRefundPayloadDTO;
use Kirki\Ecommerce\App\DTO\Refund\UpdateRefundPayloadDTO;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

/**
 * Provides convenient methods for order operations.
 *
 * A collaborator class that delegates to the order action classes and the
 * order service.
 *
 * @since 1.0.0
 */
class OrderManager
{
    /** @var CreateOrderAction */
    protected $create_order_action;
    /** @var UpdateOrderAction */
    protected $update_order_action;
    /** @var OrderService */
    protected $order_service;
    /** @var InventoryService */
    protected $inventory_service;
    /** @var CreateRefundAction */
    protected $create_refund_action;
    /** @var UpdateRefundAction */
    protected $update_refund_action;
    /** @var CouponService */
    protected $coupon_service;

    /**
     * Create the manager with the actions and services it delegates to.
     *
     * @since 1.0.0
     *
     * @param CreateOrderAction  $create_order_action
     * @param UpdateOrderAction  $update_order_action
     * @param OrderService       $order_service
     * @param InventoryService   $inventory_service
     * @param CreateRefundAction $create_refund_action
     * @param UpdateRefundAction $update_refund_action
     * @param CouponService      $coupon_service
     */
    public function __construct(
        CreateOrderAction $create_order_action,
        UpdateOrderAction $update_order_action,
        OrderService $order_service,
        InventoryService $inventory_service,
        CreateRefundAction $create_refund_action,
        UpdateRefundAction $update_refund_action,
        CouponService $coupon_service
    ) {
        $this->create_order_action = $create_order_action;
        $this->update_order_action = $update_order_action;
        $this->order_service = $order_service;
        $this->inventory_service = $inventory_service;
        $this->create_refund_action = $create_refund_action;
        $this->update_refund_action = $update_refund_action;
        $this->coupon_service = $coupon_service;
    }

    /**
     * Create a new order.
     *
     * @since 1.0.0
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
     * @since 1.0.0
     *
     * @param UpdateOrderPayloadDTO $dto
     * @return Order
     */
    public function update(UpdateOrderPayloadDTO $dto)
    {
        return $this->update_order_action->execute($dto);
    }

    /**
     * Mark an order's fulfillment status as unfulfilled.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when the order was updated.
     */
    public function mark_as_unfulfilled(int $id)
    {
        return $this->order_service->partial_update_order($id, ['fulfillment_status' => FulfillmentStatus::UNFULFILLED]);
    }

    /**
     * Cancel an order.
     *
     * When the cancel transition is applied, reverses coupon usage, releases
     * reserved stock, records the reason and cancellation time, and logs the
     * activity.
     *
     * @since 1.0.0
     *
     * @param int         $id     Order ID.
     * @param string|null $reason Cancellation reason.
     * @return bool True when the cancel transition was applied.
     */
    public function mark_as_cancel(int $id, $reason = null)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $is_cancelled = $this->order_service->apply_order_action($id, $order->order_status, OrderAction::CANCEL_ORDER);

        if ($is_cancelled) {
            $order->order_coupons->reject(fn($order_coupon) => !empty($order_coupon->usage_reversed_at))->each(function ($order_coupon) {
                $order_coupon->update(['usage_reversed_at' => Date::now()]);
                $this->coupon_service->decrement($order_coupon->coupon_id, 'current_usage_count');
            });

            $this->inventory_service->release_all_reserved_stock($order);
            $this->order_service->partial_update_order($id, [
                'cancellation_reason' => $reason,
                'cancelled_at' => Date::now(),
            ]);
            
            OrderActivity::log($this->order_service->find_order_or_fail($id), OrderActivityType::CANCELLED);
        }

        return $is_cancelled;
    }

    /**
     * Mark an order as processing, or resume fulfillment when it was on hold.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when the transition was applied.
     */
    public function mark_as_processing(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $is_resuming = $order->fulfillment_status === FulfillmentStatus::ON_HOLD;
        $action = $is_resuming
            ? OrderAction::RESUME_FULFILLMENT
            : OrderAction::MARK_AS_PROCESSING;

        $is_updated = $this->order_service->apply_order_action($id, $order->order_status, $action);

        if ($is_updated) {
            $order = $this->order_service->find_order_or_fail($id);
            OrderActivity::log($order, $is_resuming ? OrderActivityType::FULFILLMENT_RESUMED : OrderActivityType::PROCESSING);
        }

        return $is_updated;
    }

    /**
     * Mark an order's fulfillment as on hold.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when the transition was applied.
     */
    public function mark_as_on_hold(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $is_on_hold = $this->order_service->apply_order_action($id, $order->order_status, OrderAction::MARK_AS_HOLD);

        if ($is_on_hold) {
            OrderActivity::log($this->order_service->find_order_or_fail($id), OrderActivityType::ON_HOLD);
        }

        return $is_on_hold;
    }

    /**
     * Mark an order as shipped and record the shipping time.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when the transition was applied.
     */
    public function mark_as_shipped(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $is_shipped = $this->order_service->apply_order_action($id, $order->order_status, OrderAction::MARK_AS_SHIPPED);

        if ($is_shipped) {
            $this->order_service->partial_update_order($id, ['shipped_at' => Date::now()]);
            OrderActivity::log($this->order_service->find_order_or_fail($id), OrderActivityType::SHIPPED);
        }

        return $is_shipped;
    }

    /**
     * Mark an order as delivered and record the delivery time.
     *
     * Confirms the order's reserved stock when the order is already paid.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when the transition was applied.
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

            OrderActivity::log($this->order_service->find_order_or_fail($id), OrderActivityType::DELIVERED);
        }

        return $is_delivered;
    }

    /**
     * Set the shipping carrier and tracking details of an order.
     *
     * @since 1.0.0
     *
     * @param int                  $id       Order ID.
     * @param array<string, mixed> $tracking Accepts carrier, tracking_number and tracking_url keys.
     * @return bool True when the order was updated.
     */
    public function add_tracking(int $id, array $tracking)
    {
        $is_updated = $this->order_service->partial_update_order($id, [
            'shipping_carrier' => $tracking['carrier'] ?? null,
            'shipping_tracking_number' => $tracking['tracking_number'] ?? null,
            'shipping_tracking_url' => $tracking['tracking_url'] ?? null,
        ]);

        if ($is_updated) {
            OrderActivity::log($this->order_service->find_order_or_fail($id), OrderActivityType::TRACKING_ADDED);
        }

        return $is_updated;
    }

    /**
     * Mark an order as archived.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when the order was updated.
     */
    public function mark_as_archive(int $id)
    {
        $is_updated = $this->order_service->partial_update_order($id, ['archived_at' => Date::now()]);

        if ($is_updated) {
            OrderActivity::log($this->order_service->find_order_or_fail($id), OrderActivityType::ARCHIVED);
        }

        return $is_updated;
    }

    /**
     * Mark an order's payment as paid.
     *
     * Records the payment time and provider, confirms reserved stock when the
     * order is already delivered, and logs the activity.
     *
     * @since 1.0.0
     *
     * @param int         $id               Order ID.
     * @param string|null $payment_provider Payment provider ID to store on the order.
     * @return bool True when the paid transition was applied.
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

            OrderActivity::log($this->order_service->find_order_or_fail($id), OrderActivityType::PAYMENT_COMPLETED);
        }

        return $is_paid;
    }

    /**
     * Mark an order's payment as unpaid.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when the order was updated.
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
     * Mark an order's payment as failed and log the activity.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when the order was updated.
     */
    public function mark_payment_as_failed(int $id)
    {
        $order = $this->order_service->find_order_or_fail($id);
        $order_status = OrderStatus::find_by_pair($order->fulfillment_status, PaymentStatus::FAILED);

        $is_updated = $this->order_service->partial_update_order($id, [
            'payment_status' => PaymentStatus::FAILED,
            'order_status' => $order_status,
        ]);

        if ($is_updated) {
            OrderActivity::log($this->order_service->find_order_or_fail($id), OrderActivityType::PAYMENT_FAILED);
        }

        return $is_updated;
    }

    /**
     * Mark an order's initiated refund as completed and release its reserved stock.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool True when the order was marked as refunded.
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
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return Order|null
     */
    public function find(int $id)
    {
        return $this->order_service->find_order($id);
    }

    /**
     * Find an order by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return Order
     * @throws \Kirki\Ecommerce\Framework\Exceptions\NotFoundException When the order does not exist.
     */
    public function find_or_fail(int $id)
    {
        return $this->order_service->find_order_or_fail($id);
    }

    /**
     * Find an order by UUID.
     *
     * @since 1.0.0
     *
     * @param string $uuid
     * @return Order|null
     */
    public function find_by_uuid(string $uuid)
    {
        return $this->order_service->find_order_by_uuid($uuid);
    }

    /**
     * Find an order by payment transaction ID.
     *
     * @since 1.0.0
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
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool
     */
    public function delete(int $id)
    {
        return $this->order_service->delete_order($id);
    }

    /**
     * Delete an order by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool
     * @throws \Kirki\Ecommerce\Framework\Exceptions\NotFoundException When the order does not exist.
     */
    public function delete_or_fail(int $id)
    {
        return $this->order_service->delete_order_or_fail($id);
    }

    /**
     * Set the payment transaction ID of an order.
     *
     * @since 1.0.0
     *
     * @param int    $id             Order ID.
     * @param string $transaction_id
     * @return bool True when the order was updated.
     */
    public function set_transaction_id(int $id, string $transaction_id)
    {
        return $this->order_service->partial_update_order($id, ['payment_transaction_id' => $transaction_id]);
    }

    /**
     * Set the payment provider fee of an order.
     *
     * Stores the fee in both the order's invoiced (transaction) currency and the
     * store's base currency.
     *
     * @since 1.0.0
     *
     * @param int $id  Order ID.
     * @param int $fee Fee in the order's invoiced currency, minor units.
     * @return bool False when the order does not exist or was not updated.
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
     * Convert an invoiced-currency fee to the store's base currency.
     *
     * Uses the order's own frozen exchange rate rather than a live rate.
     *
     * @since 1.0.0
     *
     * @param int   $fee   Fee in the order's invoiced currency, minor units.
     * @param Order $order
     * @return int Fee in the base currency, minor units.
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
     * @since 1.0.0
     *
     * @param CreateRefundPayloadDTO $dto
     * @return Order The order with its refunds reloaded.
     */
    public function create_refund(CreateRefundPayloadDTO $dto)
    {
        return $this->create_refund_action->execute($dto);
    }

    /**
     * Update a refund of an order.
     *
     * @since 1.0.0
     *
     * @param UpdateRefundPayloadDTO $dto
     * @return Order The order with its refunds reloaded.
     */
    public function update_refund(UpdateRefundPayloadDTO $dto)
    {
        return $this->update_refund_action->execute($dto);
    }

    /**
     * Get a single refund of an order.
     *
     * @since 1.0.0
     *
     * @param Order $order
     * @param int   $id    Refund ID.
     * @return \Kirki\Ecommerce\App\Models\Refund|null Null when the order has no such refund.
     */
    public function get_refund(Order $order, int $id)
    {
        return $order->refunds->filter(fn($refund) => (int) $refund->id === (int) $id)->values()->first();
    }

    /**
     * Set the payment metadata of an order.
     *
     * @since 1.0.0
     *
     * @param int    $id               Order ID.
     * @param string $payment_metadata Provider payload to store, typically JSON.
     * @return bool True when the order was updated.
     */
    public function set_payment_metadata(int $id, string $payment_metadata)
    {
        return $this->order_service->partial_update_order($id, ['payment_metadata' => $payment_metadata]);
    }

    /**
     * Send the invoice email of an order to the customer.
     *
     * Not implemented yet; always returns false.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
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
     * Not implemented yet; always returns false.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
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
     * Not implemented yet; always returns false.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return bool
     */
    public function resend_order_email(int $id)
    {
        // @todo: implement once the order email layer exists. SendNotificationEmail::handle()
        // is currently an empty listener and OrderShipped is never dispatched.
        return false;
    }
}
