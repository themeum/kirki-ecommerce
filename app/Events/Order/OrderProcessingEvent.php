<?php

namespace Kirki\Ecommerce\App\Events\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for an order that has been marked as processing.
 *
 * Dispatched when an admin marks the order as processing; resuming fulfillment of an on-hold order does not dispatch it.
 *
 * @since 1.0.0
 */
class OrderProcessingEvent
{
    use Dispatchable;

    /** @var Order */
    public $order;

    /**
     * Create the event for an order marked as processing.
     *
     * @since 1.0.0
     *
     * @param Order $order The order marked as processing.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
