<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Order\OrderNoteAddedEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderNoteMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderNoteAddedEvent that queues the order-note email, carrying the note's text, to the customer.
 *
 * @since 1.0.0
 */
class SendOrderNoteNotificationsListener extends Listener
{
    /**
     * Handle the OrderNoteAddedEvent.
     *
     * @since 1.0.0
     *
     * @param OrderNoteAddedEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderNoteAddedEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerOrderNoteMail::class, (string) $event->order->customer_email, [$event->note]);
    }
}
