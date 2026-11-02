<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Order\OrderCancelledEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Listeners\Concerns\ResolvesStoreAdminEmail;
use Kirki\Ecommerce\App\Mails\Admins\AdminOrderCancelledMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerOrderCancelMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderCancelledEvent that queues the order-cancelled emails to the customer and the store admin.
 *
 * May run inside the order transition's transaction, so it only queues jobs:
 * the queued rows roll back with a failed transition.
 *
 * @since 1.0.0
 */
class SendOrderCancelledNotificationsListener extends Listener
{
    use ResolvesStoreAdminEmail;

    /**
     * Handle the OrderCancelledEvent.
     *
     * @since 1.0.0
     *
     * @param OrderCancelledEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderCancelledEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerOrderCancelMail::class, (string) $event->order->customer_email);
        SendOrderMailJob::dispatch($event->order, AdminOrderCancelledMail::class, $this->get_admin_email());
    }
}
