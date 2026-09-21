<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderShipped;
use Kirki\Ecommerce\Framework\Listener;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

/**
 * Listener for OrderShipped that is meant to send a notification email, currently a no-op.
 *
 * @since 1.0.0
 */
class SendNotificationEmail extends Listener
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function priority()
    {
        return 0;
    }

    /**
     * Handle the OrderShipped event.
     *
     * @since 1.0.0
     *
     * @param OrderShipped $event The dispatched event.
     * @return void
     */
    public function handle(OrderShipped $event)
    {
        // Handle sending notification
    }
}
