<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

use Kirki\Ecommerce\App\Events\Order\OrderPlacedEvent;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Mails\Admins\AdminNewOrderMail;
use Kirki\Ecommerce\App\Mails\Customers\CustomerNewOrderMail;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Listener;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

/**
 * Listener for OrderPlacedEvent that queues the new-order emails to the
 * customer and the store admin.
 *
 * One job per recipient, so a retry after a failed send never emails a
 * recipient who already received it.
 *
 * @since 1.0.0
 */
class SendOrderPlacedNotificationsListener extends Listener
{
    /**
     * Handle the OrderPlacedEvent.
     *
     * @since 1.0.0
     *
     * @param OrderPlacedEvent $event The dispatched event.
     * @return void
     */
    public function handle(OrderPlacedEvent $event)
    {
        SendOrderMailJob::dispatch($event->order, CustomerNewOrderMail::class, (string) $event->order->customer_email);
        SendOrderMailJob::dispatch($event->order, AdminNewOrderMail::class, $this->get_admin_email());
    }

    /**
     * Get the admin email address from the eCommerce settings,
     * falling back to the WP admin email when it is not set.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function get_admin_email()
    {
        return (string) (Settings::get('general.store_email') ?: Option::get('admin_email', '', false));
    }
}
