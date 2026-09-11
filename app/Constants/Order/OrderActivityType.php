<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

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
     * Get the list of order activity types.
     *
     * @since 1.0.0
     * 
     * @return array<string, string>
     */
    public static function get_list(): array
    {
        return [
            self::ORDER_PLACED => __( 'Order Placed', 'kirki-ecommerce' ),
            self::PAYMENT_COMPLETED => __( 'Payment Completed', 'kirki-ecommerce' ),
            self::PAYMENT_FAILED => __( 'Payment Failed', 'kirki-ecommerce' ),
            self::PROCESSING => __( 'Order Processing', 'kirki-ecommerce' ),
            self::FULFILLMENT_RESUMED => __( 'Fulfillment Resumed', 'kirki-ecommerce' ),
            self::SHIPPED => __( 'Order Shipped', 'kirki-ecommerce' ),
            self::DELIVERED => __( 'Order Delivered', 'kirki-ecommerce' ),
            self::CANCELLED => __( 'Order Cancelled', 'kirki-ecommerce' ),
            self::TRACKING_ADDED => __( 'Tracking Added', 'kirki-ecommerce' ),
            self::ARCHIVED => __( 'Order Archived', 'kirki-ecommerce' ),
            self::ON_HOLD => __( 'Order On Hold', 'kirki-ecommerce' ),
            self::PARTIALLY_REFUNDED => __( 'Order Partially Refunded', 'kirki-ecommerce' ),
            self::REFUNDED => __( 'Order Refunded', 'kirki-ecommerce' ),
            self::REFUND_REQUESTED => __( 'Order Refund Requested', 'kirki-ecommerce' ),
            self::REFUND_DELETED => __( 'Order Refund Deleted', 'kirki-ecommerce' ),
            self::COMMENT_ADDED => __( 'Comment Added', 'kirki-ecommerce' ),
        ];
    }

    /**
     * Get the formatted order activity type.
     *
     * @since 1.0.0
     * 
     * @param string $type
     * @return string
     */
    public static function get_formatted( $type )
    {
        return static::get_list()[$type] ?? '';
    }
}
