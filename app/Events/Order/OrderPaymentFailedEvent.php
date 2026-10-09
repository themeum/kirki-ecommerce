<?php

namespace Kirki\Ecommerce\App\Events\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for an order whose payment has failed.
 *
 * Dispatched only when the payment status changes to failed, so a payment gateway repeating a failure notification does not dispatch it again.
 *
 * @since 1.0.0
 */
class OrderPaymentFailedEvent
{
    use Dispatchable;

    /** @var Order */
    public $order;

    /**
     * Create the event for an order whose payment failed.
     *
     * @since 1.0.0
     *
     * @param Order $order The order whose payment failed.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
