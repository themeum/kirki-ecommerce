<?php

namespace Kirki\Ecommerce\App\Events\Order;

use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for an order that has been shipped.
 *
 * @since 1.0.0
 */
class OrderShippedEvent
{
    use Dispatchable;

    /** @var mixed */
    public $order;

    /**
     * Create the event for a shipped order.
     *
     * @since 1.0.0
     *
     * @param mixed $order The order that was shipped.
     */
    public function __construct($order)
    {
        $this->order = $order;
    }
}
