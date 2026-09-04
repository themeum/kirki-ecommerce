<?php

namespace Kirki\Ecommerce\App\Managers;

use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderActivity;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Services\OrderActivityService;
use Kirki\Ecommerce\App\Supports\ExceptionThrower;

use function Kirki\Ecommerce\Framework\user;

/**
 * OrderActivityManager class
 *
 * A collaborator class recording and describing order activities. Everything
 * needed to record an order-state activity (order-placed, shipped, cancelled,
 * ...) lives on the order itself by the time it's recorded, so those all go
 * through the single log() entry point, which dispatches to a protected
 * method per type. Refund and comment activities carry data no order alone
 * has (which specific refund, the comment text), so they keep their own
 * public methods, called directly from their trigger points.
 */
class OrderActivityManager
{
    protected $order_activity_service;

    public function __construct(OrderActivityService $order_activity_service)
    {
        $this->order_activity_service = $order_activity_service;
    }

    /**
     * Record an order-state activity, dispatching to the method for the
     * given type. Covers every activity type whose metadata is derivable
     * from the order alone - not refund or comment activities, which carry
     * data no order alone has and are recorded via their own methods.
     *
     * @param Order $order
     * @param string $activity_type One of the OrderActivityType constants.
     * @return OrderActivity
     * @throws \InvalidArgumentException When the type has no order-state handler.
     */
    public function log(Order $order, string $activity_type)
    {
        switch ($activity_type) {
            case OrderActivityType::ORDER_PLACED:
                return $this->order_placed($order);
            case OrderActivityType::PAYMENT_COMPLETED:
                return $this->payment_completed($order);
            case OrderActivityType::PAYMENT_FAILED:
                return $this->payment_failed($order);
            case OrderActivityType::PROCESSING:
                return $this->processing($order);
            case OrderActivityType::FULFILLMENT_RESUMED:
                return $this->fulfillment_resumed($order);
            case OrderActivityType::SHIPPED:
                return $this->shipped($order);
            case OrderActivityType::DELIVERED:
                return $this->delivered($order);
            case OrderActivityType::CANCELLED:
                return $this->cancelled($order);
            case OrderActivityType::TRACKING_ADDED:
                return $this->tracking_added($order);
            case OrderActivityType::ARCHIVED:
                return $this->archived($order);
            case OrderActivityType::ON_HOLD:
                return $this->on_hold($order);
            default:
                ExceptionThrower::throw(new \InvalidArgumentException("No order-state activity handler for type [{$activity_type}]."));
        }
    }

    /**
     * Record that an order was placed.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function order_placed(Order $order)
    {
        $metadata = [
            'order_number' => $order->order_number,
            'is_manual' => $order->is_manual,
            'item_summary' => $this->build_item_summary($order),
        ];

        return $this->record($order->id, OrderActivityType::ORDER_PLACED, $metadata, $this->resolve_author());
    }

    /**
     * Record that a payment was completed for an order.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function payment_completed(Order $order)
    {
        return $this->record($order->id, OrderActivityType::PAYMENT_COMPLETED, [
            'amount' => $order->invoiced_total,
            'currency_code' => $order->currency_code,
            'provider' => $order->payment_provider,
        ], $this->resolve_author());
    }

    /**
     * Record that a payment attempt failed for an order.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function payment_failed(Order $order)
    {
        return $this->record($order->id, OrderActivityType::PAYMENT_FAILED, [], $this->resolve_author());
    }

    /**
     * Record that an order was marked as processing.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function processing(Order $order)
    {
        return $this->record($order->id, OrderActivityType::PROCESSING, [], $this->resolve_author());
    }

    /**
     * Record that an order's fulfillment was resumed from hold.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function fulfillment_resumed(Order $order)
    {
        return $this->record($order->id, OrderActivityType::FULFILLMENT_RESUMED, [], $this->resolve_author());
    }

    /**
     * Record that an order was marked as shipped.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function shipped(Order $order)
    {
        return $this->record($order->id, OrderActivityType::SHIPPED, [], $this->resolve_author());
    }

    /**
     * Record that an order was marked as delivered.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function delivered(Order $order)
    {
        return $this->record($order->id, OrderActivityType::DELIVERED, [], $this->resolve_author());
    }

    /**
     * Record that an order was cancelled.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function cancelled(Order $order)
    {
        return $this->record($order->id, OrderActivityType::CANCELLED, [
            'reason' => $order->cancellation_reason,
        ], $this->resolve_author());
    }

    /**
     * Record that shipping/tracking details were added to an order.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function tracking_added(Order $order)
    {
        return $this->record($order->id, OrderActivityType::TRACKING_ADDED, [
            'carrier' => $order->shipping_carrier,
            'tracking_number' => $order->shipping_tracking_number,
            'tracking_url' => $order->shipping_tracking_url,
        ], $this->resolve_author());
    }

    /**
     * Record that an order was archived.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function archived(Order $order)
    {
        return $this->record($order->id, OrderActivityType::ARCHIVED, [], $this->resolve_author());
    }

    /**
     * Record that an order was put on hold.
     *
     * @param Order $order
     * @return OrderActivity
     */
    protected function on_hold(Order $order)
    {
        return $this->record($order->id, OrderActivityType::ON_HOLD, [], $this->resolve_author());
    }

    /**
     * Record a partial refund for an order.
     *
     * @param Order $order
     * @param Refund $refund
     * @return OrderActivity
     */
    public function partially_refunded(Order $order, Refund $refund)
    {
        return $this->record($order->id, OrderActivityType::PARTIALLY_REFUNDED, [
            'amount' => $refund->invoiced_amount,
            'currency_code' => $order->currency_code,
        ], $this->resolve_author($refund->created_by));
    }

    /**
     * Record a full refund for an order.
     *
     * @param Order $order
     * @param Refund $refund
     * @return OrderActivity
     */
    public function refunded(Order $order, Refund $refund)
    {
        return $this->record($order->id, OrderActivityType::REFUNDED, [
            'amount' => $refund->invoiced_amount,
            'currency_code' => $order->currency_code,
        ], $this->resolve_author($refund->created_by));
    }

    /**
     * Record that a refund was requested for an order.
     *
     * @param Order $order
     * @param Refund $refund
     * @return OrderActivity
     */
    public function refund_requested(Order $order, Refund $refund)
    {
        return $this->record($order->id, OrderActivityType::REFUND_REQUESTED, [
            'amount' => $refund->invoiced_amount,
            'currency_code' => $order->currency_code,
            'reason' => $refund->reason,
        ], $this->resolve_author($refund->created_by));
    }

    /**
     * Record that a refund was deleted from an order.
     *
     * @param Order $order
     * @param array $refund_snapshot Accepts id, invoiced_amount and currency_code keys.
     * @return OrderActivity
     */
    public function refund_deleted(Order $order, array $refund_snapshot)
    {
        return $this->record($order->id, OrderActivityType::REFUND_DELETED, [
            'amount' => $refund_snapshot['invoiced_amount'] ?? null,
            'currency_code' => $refund_snapshot['currency_code'] ?? $order->currency_code,
        ], $this->resolve_author());
    }

    /**
     * Add a comment activity to an order.
     *
     * @param int $order_id
     * @param string $message
     * @param int|null $created_by
     * @return OrderActivity
     */
    public function comment(int $order_id, string $message, ?int $created_by = null)
    {
        return $this->order_activity_service->create(
            $order_id,
            OrderActivityType::COMMENT_ADDED,
            $message,
            null,
            $this->resolve_author($created_by)
        );
    }

    /**
     * Build the human-readable description for an activity.
     *
     * Comment activities carry their own description verbatim. Every other
     * activity type is described here, at read time, from its stored
     * metadata, so copy can change without touching stored data.
     *
     * @param OrderActivity $activity
     * @return string
     */
    public function describe(OrderActivity $activity)
    {
        if ($activity->activity_type === OrderActivityType::COMMENT_ADDED) {
            return (string) $activity->description;
        }

        $metadata = $activity->metadata ?? [];

        switch ($activity->activity_type) {
            case OrderActivityType::ORDER_PLACED:
                return $this->describe_order_placed($metadata);
            case OrderActivityType::PAYMENT_COMPLETED:
                return $this->describe_payment_completed($metadata);
            case OrderActivityType::PAYMENT_FAILED:
                return __('Payment failed.', 'kirki-ecommerce');
            case OrderActivityType::PROCESSING:
                return __('Order marked as processing.', 'kirki-ecommerce');
            case OrderActivityType::FULFILLMENT_RESUMED:
                return __('Order fulfillment resumed.', 'kirki-ecommerce');
            case OrderActivityType::SHIPPED:
                return __('Order marked as shipped.', 'kirki-ecommerce');
            case OrderActivityType::DELIVERED:
                return __('Order marked as delivered.', 'kirki-ecommerce');
            case OrderActivityType::CANCELLED:
                return $this->describe_cancelled($metadata);
            case OrderActivityType::TRACKING_ADDED:
                return $this->describe_tracking_added($metadata);
            case OrderActivityType::ARCHIVED:
                return __('Order archived.', 'kirki-ecommerce');
            case OrderActivityType::ON_HOLD:
                return __('Order put on hold.', 'kirki-ecommerce');
            case OrderActivityType::PARTIALLY_REFUNDED:
                return $this->describe_partially_refunded($metadata);
            case OrderActivityType::REFUNDED:
                return $this->describe_refunded($metadata);
            case OrderActivityType::REFUND_REQUESTED:
                return $this->describe_refund_requested($metadata);
            case OrderActivityType::REFUND_DELETED:
                return $this->describe_refund_deleted($metadata);
            default:
                return __('Order updated.', 'kirki-ecommerce');
        }
    }

    protected function record(int $order_id, string $type, array $metadata, ?int $created_by)
    {
        return $this->order_activity_service->create($order_id, $type, null, $metadata, $created_by);
    }

    protected function resolve_author(?int $created_by = null)
    {
        if (!empty($created_by)) {
            return $created_by;
        }

        $user_id = user()->get_id();

        return !empty($user_id) ? $user_id : null;
    }

    protected function build_item_summary(Order $order)
    {
        $items = $order->items;

        if (empty($items) || $items->count() === 0) {
            return __('items', 'kirki-ecommerce');
        }

        if ($items->count() === 1) {
            return $items->first()->product_name;
        }

        /* translators: %d: number of items */
        return sprintf(__('%d items', 'kirki-ecommerce'), $items->count());
    }

    protected function describe_order_placed(array $metadata)
    {
        $order_number = $metadata['order_number'] ?? '';
        $item_summary = $metadata['item_summary'] ?? '';

        /* translators: %1$s: item summary, %2$s: order number */
        return sprintf(__('Order placed for %1$s #%2$s', 'kirki-ecommerce'), $item_summary, $order_number);
    }

    protected function describe_payment_completed(array $metadata)
    {
        $amount = $this->format_amount($metadata);

        if (empty($amount)) {
            return __('Payment completed.', 'kirki-ecommerce');
        }

        if (!empty($metadata['provider'])) {
            /* translators: %1$s: payment amount, %2$s: payment provider name */
            return sprintf(__('Payment of %1$s completed via %2$s.', 'kirki-ecommerce'), $amount, $metadata['provider']);
        }

        /* translators: %s: payment amount */
        return sprintf(__('Payment of %s completed.', 'kirki-ecommerce'), $amount);
    }

    protected function describe_cancelled(array $metadata)
    {
        if (!empty($metadata['reason'])) {
            /* translators: %s: cancellation reason */
            return sprintf(__('Order cancelled: %s', 'kirki-ecommerce'), $metadata['reason']);
        }

        return __('Order cancelled.', 'kirki-ecommerce');
    }

    protected function describe_tracking_added(array $metadata)
    {
        if (!empty($metadata['carrier']) && !empty($metadata['tracking_number'])) {
            /* translators: %1$s: shipping carrier, %2$s: tracking number */
            return sprintf(__('Tracking added: %1$s #%2$s', 'kirki-ecommerce'), $metadata['carrier'], $metadata['tracking_number']);
        }

        if (!empty($metadata['tracking_number'])) {
            /* translators: %s: tracking number */
            return sprintf(__('Tracking number added: %s', 'kirki-ecommerce'), $metadata['tracking_number']);
        }

        return __('Tracking information added.', 'kirki-ecommerce');
    }

    protected function describe_partially_refunded(array $metadata)
    {
        $amount = $this->format_amount($metadata);

        if (empty($amount)) {
            return __('Order partially refunded.', 'kirki-ecommerce');
        }

        /* translators: %s: refund amount */
        return sprintf(__('Partial refund of %s issued.', 'kirki-ecommerce'), $amount);
    }

    protected function describe_refunded(array $metadata)
    {
        $amount = $this->format_amount($metadata);

        if (empty($amount)) {
            return __('Order refunded.', 'kirki-ecommerce');
        }

        /* translators: %s: refund amount */
        return sprintf(__('Refund of %s issued.', 'kirki-ecommerce'), $amount);
    }

    protected function describe_refund_requested(array $metadata)
    {
        $amount = $this->format_amount($metadata);

        if (empty($amount)) {
            return __('Refund requested.', 'kirki-ecommerce');
        }

        /* translators: %s: refund amount */
        return sprintf(__('Refund of %s requested.', 'kirki-ecommerce'), $amount);
    }

    protected function describe_refund_deleted(array $metadata)
    {
        $amount = $this->format_amount($metadata);

        if (empty($amount)) {
            return __('Refund deleted.', 'kirki-ecommerce');
        }

        /* translators: %s: refund amount */
        return sprintf(__('Refund of %s deleted.', 'kirki-ecommerce'), $amount);
    }

    protected function format_amount(array $metadata)
    {
        if (!isset($metadata['amount'])) {
            return null;
        }

        return Money::format_from_minor($metadata['amount'], $metadata['currency_code'] ?? null);
    }
}
