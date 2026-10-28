<?php

namespace Kirki\Ecommerce\App\Events\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for an order that got its carrier and tracking details.
 *
 * Dispatched each time tracking is added, with the order holding the latest details.
 *
 * @since 1.0.0
 */
class OrderTrackingAddedEvent
{
    use Dispatchable;

    /** @var Order */
    public $order;

    /**
     * Create the event for an order with tracking details.
     *
     * @since 1.0.0
     *
     * @param Order $order The order the tracking was added to.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
