<?php

namespace Kirki\Ecommerce\App\Events\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for an order that has been cancelled.
 *
 * Dispatched once the cancel transition is applied, whether the order or only its fulfillment was cancelled.
 *
 * @since 1.0.0
 */
class OrderCancelledEvent
{
    use Dispatchable;

    /** @var Order */
    public $order;

    /**
     * Create the event for a cancelled order.
     *
     * @since 1.0.0
     *
     * @param Order $order The cancelled order.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
