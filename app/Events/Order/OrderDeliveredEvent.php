<?php

namespace Kirki\Ecommerce\App\Events\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for an order that has been marked as delivered, whatever its payment status.
 *
 * Dispatched only when marking the order as delivered actually changed its status, so it fires once per order.
 *
 * @since 1.0.0
 */
class OrderDeliveredEvent
{
    use Dispatchable;

    /** @var Order */
    public $order;

    /**
     * Create the event for a delivered order.
     *
     * @since 1.0.0
     *
     * @param Order $order The delivered order.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
