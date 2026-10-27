<?php

namespace Kirki\Ecommerce\App\Events\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for an order whose fulfillment has been put on hold.
 *
 * Dispatched once the on-hold transition is applied.
 *
 * @since 1.0.0
 */
class OrderOnHoldEvent
{
    use Dispatchable;

    /** @var Order */
    public $order;

    /**
     * Create the event for an order put on hold.
     *
     * @since 1.0.0
     *
     * @param Order $order The order put on hold.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
