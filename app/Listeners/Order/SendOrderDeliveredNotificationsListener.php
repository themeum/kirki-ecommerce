<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Order\OrderDeliveredEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderCompletedMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderDeliveredEvent that queues the order-delivered email to the customer.
 *
 * May run inside the order transition's transaction, so it only queues jobs:
 * the queued rows roll back with a failed transition.
 *
 * @since 1.0.0
 */
class SendOrderDeliveredNotificationsListener extends Listener
{
    /**
     * Handle the OrderDeliveredEvent.
     *
     * @since 1.0.0
     *
     * @param OrderDeliveredEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderDeliveredEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerOrderCompletedMail::class, (string) $event->order->customer_email);
    }
}
