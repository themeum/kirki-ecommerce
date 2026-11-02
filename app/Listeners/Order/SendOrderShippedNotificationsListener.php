<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Order\OrderShippedEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderShippedMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderShippedEvent that queues the order-shipped email to the customer.
 *
 * May run inside the order transition's transaction, so it only queues jobs:
 * the queued rows roll back with a failed transition.
 *
 * @since 1.0.0
 */
class SendOrderShippedNotificationsListener extends Listener
{
    /**
     * Handle the OrderShippedEvent.
     *
     * @since 1.0.0
     *
     * @param OrderShippedEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderShippedEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerOrderShippedMail::class, (string) $event->order->customer_email);
    }
}
