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
}
