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
}
