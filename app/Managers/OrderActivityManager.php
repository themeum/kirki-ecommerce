<?php

namespace Kirki\Ecommerce\App\Managers;

use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderActivity;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Services\OrderActivityService;

use function Kirki\Ecommerce\Framework\user;

/**
 * OrderActivityManager class
 *
 * A collaborator class exposing one semantic method per order activity type,
 * plus the read-time description builder for system activities. Everything
 * about order activities - how they're recorded and how they're described -
 * lives here, independent of whether recording is called directly from an
 * action/manager or from an event listener.
 */
class OrderActivityManager
{
    protected $order_activity_service;

    public function __construct(OrderActivityService $order_activity_service)
    {
        $this->order_activity_service = $order_activity_service;
    }

    /**
     * Record that an order was placed.
     *
     * @param Order $order
     * @return OrderActivity
     */
    public function order_placed(Order $order)
    {
        $author_id = !empty($order->created_by) ? (int) $order->created_by : null;

        $metadata = [
            'order_number' => $order->order_number,
            'is_manual' => (bool) $order->is_manual,
            'item_summary' => $this->build_item_summary($order),
        ];

        if (!empty($author_id)) {
            $wp_user = get_userdata($author_id);
            $metadata['author_name'] = $wp_user ? $wp_user->display_name : null;
        }

        return $this->record($order->id, OrderActivityType::ORDER_PLACED, $metadata, $author_id);
    }

    /**
     * Record that a payment was completed for an order.
     *
     * @param Order $order
     * @param string|null $provider
     * @return OrderActivity
     */
    public function payment_completed(Order $order, ?string $provider = null)
    {
        return $this->record($order->id, OrderActivityType::PAYMENT_COMPLETED, [
            'amount' => $order->invoiced_total,
            'currency_code' => $order->currency_code,
            'provider' => $provider ?? $order->payment_provider,
        ], $this->resolve_author());
    }

    /**
     * Record that a payment attempt failed for an order.
     *
     * @param Order $order
     * @return OrderActivity
     */
    public function payment_failed(Order $order)
    {
        return $this->record($order->id, OrderActivityType::PAYMENT_FAILED, [], $this->resolve_author());
    }

    /**
     * Record an order status transition.
     *
     * @param Order $order
     * @param string $from
     * @param string $to
     * @return OrderActivity
     */
    public function status_changed(Order $order, string $from, string $to)
    {
        return $this->record($order->id, OrderActivityType::STATUS_CHANGED, [
            'from' => $from,
            'to' => $to,
        ], $this->resolve_author());
    }

    /**
     * Record that an order was marked as shipped.
     *
     * @param Order $order
     * @return OrderActivity
     */
    public function shipped(Order $order)
    {
        return $this->record($order->id, OrderActivityType::SHIPPED, [], $this->resolve_author());
    }

    /**
     * Record that an order was marked as delivered.
     *
     * @param Order $order
     * @return OrderActivity
     */
    public function delivered(Order $order)
    {
        return $this->record($order->id, OrderActivityType::DELIVERED, [], $this->resolve_author());
    }

    /**
     * Record that an order was cancelled.
     *
     * @param Order $order
     * @param string|null $reason
     * @return OrderActivity
     */
    public function cancelled(Order $order, ?string $reason = null)
    {
        return $this->record($order->id, OrderActivityType::CANCELLED, [
            'reason' => $reason,
        ], $this->resolve_author());
    }

    /**
     * Record that shipping/tracking details were added to an order.
     *
     * @param Order $order
     * @param array $tracking Accepts carrier, tracking_number and tracking_url keys.
     * @return OrderActivity
     */
    public function tracking_added(Order $order, array $tracking)
    {
        return $this->record($order->id, OrderActivityType::TRACKING_ADDED, [
            'carrier' => $tracking['carrier'] ?? null,
            'tracking_number' => $tracking['tracking_number'] ?? null,
            'tracking_url' => $tracking['tracking_url'] ?? null,
        ], $this->resolve_author());
    }

    /**
     * Record that an order was archived.
     *
     * @param Order $order
     * @return OrderActivity
     */
    public function archived(Order $order)
    {
        return $this->record($order->id, OrderActivityType::ARCHIVED, [], $this->resolve_author());
    }

    /**
     * Record that an order was put on hold.
     *
     * @param Order $order
     * @return OrderActivity
     */
    public function on_hold(Order $order)
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
            case OrderActivityType::STATUS_CHANGED:
                return $this->describe_status_changed($metadata);
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

        return sprintf(__('%d items', 'kirki-ecommerce'), $items->count());
    }

    protected function describe_order_placed(array $metadata)
    {
        $order_number = $metadata['order_number'] ?? '';

        if (!empty($metadata['is_manual'])) {
            $author_name = $metadata['author_name'] ?? __('Admin', 'kirki-ecommerce');

            return sprintf(__('%s created this draft order.', 'kirki-ecommerce'), $author_name);
        }

        $item_summary = $metadata['item_summary'] ?? '';

        return sprintf(__('Order placed for %1$s #%2$s', 'kirki-ecommerce'), $item_summary, $order_number);
    }

    protected function describe_payment_completed(array $metadata)
    {
        $amount = $this->format_amount($metadata);

        if (empty($amount)) {
            return __('Payment completed.', 'kirki-ecommerce');
        }

        if (!empty($metadata['provider'])) {
            return sprintf(__('Payment of %1$s completed via %2$s.', 'kirki-ecommerce'), $amount, $metadata['provider']);
        }

        return sprintf(__('Payment of %s completed.', 'kirki-ecommerce'), $amount);
    }

    protected function describe_status_changed(array $metadata)
    {
        $from = OrderStatus::get_formatted($metadata['from'] ?? '');
        $to = OrderStatus::get_formatted($metadata['to'] ?? '');

        if (empty($from) || empty($to)) {
            return __('Order status changed.', 'kirki-ecommerce');
        }

        return sprintf(__('Order status changed from %1$s to %2$s.', 'kirki-ecommerce'), $from, $to);
    }

    protected function describe_cancelled(array $metadata)
    {
        if (!empty($metadata['reason'])) {
            return sprintf(__('Order cancelled: %s', 'kirki-ecommerce'), $metadata['reason']);
        }

        return __('Order cancelled.', 'kirki-ecommerce');
    }

    protected function describe_tracking_added(array $metadata)
    {
        if (!empty($metadata['carrier']) && !empty($metadata['tracking_number'])) {
            return sprintf(__('Tracking added: %1$s #%2$s', 'kirki-ecommerce'), $metadata['carrier'], $metadata['tracking_number']);
        }

        if (!empty($metadata['tracking_number'])) {
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

        return sprintf(__('Partial refund of %s issued.', 'kirki-ecommerce'), $amount);
    }

    protected function describe_refunded(array $metadata)
    {
        $amount = $this->format_amount($metadata);

        if (empty($amount)) {
            return __('Order refunded.', 'kirki-ecommerce');
        }

        return sprintf(__('Refund of %s issued.', 'kirki-ecommerce'), $amount);
    }

    protected function format_amount(array $metadata)
    {
        if (!isset($metadata['amount'])) {
            return null;
        }

        return Money::format_from_minor($metadata['amount'], $metadata['currency_code'] ?? null);
    }
}
