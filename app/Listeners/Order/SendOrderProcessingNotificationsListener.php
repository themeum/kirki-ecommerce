<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Order\OrderProcessingEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderProcessingMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderProcessingEvent that queues the order-processing email to the customer.
 *
 * May run inside the order transition's transaction, so it only queues jobs:
 * the queued rows roll back with a failed transition.
 *
 * @since 1.0.0
 */
class SendOrderProcessingNotificationsListener extends Listener
{
    /**
     * Handle the OrderProcessingEvent.
     *
     * @since 1.0.0
     *
     * @param OrderProcessingEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderProcessingEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerOrderProcessingMail::class, (string) $event->order->customer_email);
    }
}
