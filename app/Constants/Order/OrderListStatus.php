<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * The order states a merchant filters the order list by.
 *
 * These are not a fourth status column. Each one names a situation a merchant
 * recognises and resolves to whichever underlying condition defines it:
 * fulfillment_status for how far the order has progressed, payment_status for
 * money, and order_status for the refund states that exist only as a composite
 * lifecycle value. Order::scope_apply_status_filter() holds that mapping.
 */
final class OrderListStatus
{
    use HasConstants;

    const ORDER_PLACED = 'order-placed';
    const ORDER_PROCESSING = 'order-processing';
    const ORDER_ON_HOLD = 'order-on-hold';
    const ORDER_SHIPPED = 'order-shipped';
    const ORDER_DELIVERED = 'order-delivered';
    const ORDER_RETURNED = 'order-returned';
    const ORDER_CANCELLED = 'order-cancelled';
    const PAYMENT_FAILED = 'payment-failed';
    const REFUND_REQUESTED = 'refund-requested';
    const REFUND_IN_PROGRESS = 'refund-in-progress';
    const REFUNDED = 'refunded';
    const REFUND_DECLINED = 'refund-declined';
}
