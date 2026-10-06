<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Types of entries recorded in an order activity timeline.
 *
 * @since 1.0.0
 */
final class OrderActivityType
{
    use HasConstants;

    const ORDER_PLACED = 'order-placed';
    const PAYMENT_COMPLETED = 'payment-completed';
    const PAYMENT_FAILED = 'payment-failed';
    const PROCESSING = 'processing';
    const FULFILLMENT_RESUMED = 'fulfillment-resumed';
    const SHIPPED = 'shipped';
    const DELIVERED = 'delivered';
    const CANCELLED = 'cancelled';
    const TRACKING_ADDED = 'tracking-added';
    const ARCHIVED = 'archived';
    const ON_HOLD = 'on-hold';
    const PARTIALLY_REFUNDED = 'partially-refunded';
    const REFUNDED = 'refunded';
    const REFUND_REQUESTED = 'refund-requested';
    const REFUND_DELETED = 'refund-deleted';
    const COMMENT_ADDED = 'comment-added';

    /**
     * Get all order activity types.
     *
     * @since 1.0.0
     *
     * @return array<string, string> Translated labels keyed by activity type.
     */
    public static function get_list(): array
    {
        return [
            static::ORDER_PLACED => __('Order Placed', 'kirki-ecommerce'),
            static::PAYMENT_COMPLETED => __('Payment Completed', 'kirki-ecommerce'),
            static::PAYMENT_FAILED => __('Payment Failed', 'kirki-ecommerce'),
            static::PROCESSING => __('Order Processing', 'kirki-ecommerce'),
            static::FULFILLMENT_RESUMED => __('Fulfillment Resumed', 'kirki-ecommerce'),
            static::SHIPPED => __('Order Shipped', 'kirki-ecommerce'),
            static::DELIVERED => __('Order Delivered', 'kirki-ecommerce'),
            static::CANCELLED => __('Order Cancelled', 'kirki-ecommerce'),
            static::TRACKING_ADDED => __('Tracking Added', 'kirki-ecommerce'),
            static::ARCHIVED => __('Order Archived', 'kirki-ecommerce'),
            static::ON_HOLD => __('Order On Hold', 'kirki-ecommerce'),
            static::PARTIALLY_REFUNDED => __('Order Partially Refunded', 'kirki-ecommerce'),
            static::REFUNDED => __('Order Refunded', 'kirki-ecommerce'),
            static::REFUND_REQUESTED => __('Order Refund Requested', 'kirki-ecommerce'),
            static::REFUND_DELETED => __('Order Refund Deleted', 'kirki-ecommerce'),
            static::COMMENT_ADDED => __('Comment Added', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the activity types a customer is allowed to see.
     *
     * The single allow-list for every customer-facing activity read. A type
     * that is not listed here stays hidden from customers.
     *
     * @since 1.0.0
     *
     * @return string[] Activity type keys.
     */
    public static function customer_visible(): array
    {
        return [
            static::ORDER_PLACED,
            static::PROCESSING,
            static::FULFILLMENT_RESUMED,
            static::SHIPPED,
            static::DELIVERED,
            static::CANCELLED,
            static::TRACKING_ADDED,
            static::ON_HOLD,
        ];
    }

    /**
     * Get the translated label for an order activity type.
     *
     * @since 1.0.0
     *
     * @param string $type Activity type key.
     * @return string Label, or an empty string for an unknown type.
     */
    public static function get_formatted($type)
    {
        return static::get_list()[$type] ?? '';
    }
}
