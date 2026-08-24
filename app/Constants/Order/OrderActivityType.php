<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

final class OrderActivityType
{
    use HasConstants;

    const ORDER_PLACED = 'order-placed';
    const PAYMENT_COMPLETED = 'payment-completed';
    const PAYMENT_FAILED = 'payment-failed';
    const STATUS_CHANGED = 'status-changed';
    const SHIPPED = 'shipped';
    const DELIVERED = 'delivered';
    const CANCELLED = 'cancelled';
    const TRACKING_ADDED = 'tracking-added';
    const ARCHIVED = 'archived';
    const ON_HOLD = 'on-hold';
    const PARTIALLY_REFUNDED = 'partially-refunded';
    const REFUNDED = 'refunded';
    const COMMENT_ADDED = 'comment-added';

    /**
     * Get all activity types.
     *
     * @return array<string, string>
     */
    public static function get_list()
    {
        return [
            self::ORDER_PLACED         => __('Order Placed', 'kirki-ecommerce'),
            self::PAYMENT_COMPLETED    => __('Payment Completed', 'kirki-ecommerce'),
            self::PAYMENT_FAILED       => __('Payment Failed', 'kirki-ecommerce'),
            self::STATUS_CHANGED       => __('Status Changed', 'kirki-ecommerce'),
            self::SHIPPED              => __('Shipped', 'kirki-ecommerce'),
            self::DELIVERED            => __('Delivered', 'kirki-ecommerce'),
            self::CANCELLED            => __('Cancelled', 'kirki-ecommerce'),
            self::TRACKING_ADDED       => __('Tracking Added', 'kirki-ecommerce'),
            self::ARCHIVED             => __('Archived', 'kirki-ecommerce'),
            self::ON_HOLD              => __('On Hold', 'kirki-ecommerce'),
            self::PARTIALLY_REFUNDED   => __('Partially Refunded', 'kirki-ecommerce'),
            self::REFUNDED             => __('Refunded', 'kirki-ecommerce'),
            self::COMMENT_ADDED        => __('Comment Added', 'kirki-ecommerce'),
        ];
    }

    /**
     * Get the formatted activity type label.
     *
     * @param string $type
     *
     * @return string
     */
    public static function get_formatted(string $type)
    {
        return static::get_list()[$type] ?? '';
    }
}
