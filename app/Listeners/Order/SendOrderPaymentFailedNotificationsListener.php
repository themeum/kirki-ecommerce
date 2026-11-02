<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Events\Order\OrderPaymentFailedEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Listeners\Concerns\ResolvesStoreAdminEmail;
use Kirki\Ecommerce\App\Mails\Admins\AdminPaymentFailedMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerPaymentFailedMail;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderPaymentFailedEvent that queues the payment-failed emails to the customer and the store admin.
 *
 * May run inside the order transition's transaction, so it only queues jobs:
 * the queued rows roll back with a failed transition.
 *
 * @since 1.0.0
 */
class SendOrderPaymentFailedNotificationsListener extends Listener
{
    use ResolvesStoreAdminEmail;

    /**
     * Handle the OrderPaymentFailedEvent.
     *
     * @since 1.0.0
     *
     * @param OrderPaymentFailedEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderPaymentFailedEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerPaymentFailedMail::class, (string) $event->order->customer_email);
        SendOrderMailJob::dispatch($event->order, AdminPaymentFailedMail::class, $this->get_admin_email());
    }
}
