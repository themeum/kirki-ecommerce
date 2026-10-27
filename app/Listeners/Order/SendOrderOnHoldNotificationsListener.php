<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Order\OrderOnHoldEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderOnHoldMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderOnHoldEvent that queues the order-on-hold email to the customer.
 *
 * May run inside the order transition's transaction, so it only queues jobs:
 * the queued rows roll back with a failed transition.
 *
 * @since 1.0.0
 */
class SendOrderOnHoldNotificationsListener extends Listener
{
    /**
     * Handle the OrderOnHoldEvent.
     *
     * @since 1.0.0
     *
     * @param OrderOnHoldEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderOnHoldEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerOrderOnHoldMail::class, (string) $event->order->customer_email);
    }
}
