<?php

namespace Kirki\Ecommerce\App\Events\Order;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for an order that has been placed.
 *
 * Dispatched after the order's transaction commits, so listeners always see
 * a persisted order and a failing listener can never roll the order back.
 *
 * @since 1.0.0
 */
class OrderPlacedEvent
{
    use Dispatchable;

    /** @var Order */
    public $order;

    /**
     * Create the event for a placed order.
     *
     * @since 1.0.0
     *
     * @param Order $order The order that was placed.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
