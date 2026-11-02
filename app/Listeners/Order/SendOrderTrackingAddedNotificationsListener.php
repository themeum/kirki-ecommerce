<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Order\OrderTrackingAddedEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderTrackingAddedMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderTrackingAddedEvent that queues the tracking-added email to the customer.
 *
 * Runs inside the add-tracking action's transaction, so it only queues jobs:
 * the queued rows roll back with a failed action.
 *
 * @since 1.0.0
 */
class SendOrderTrackingAddedNotificationsListener extends Listener
{
    /**
     * Handle the OrderTrackingAddedEvent.
     *
     * @since 1.0.0
     *
     * @param OrderTrackingAddedEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderTrackingAddedEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerOrderTrackingAddedMail::class, (string) $event->order->customer_email);
    }
}
