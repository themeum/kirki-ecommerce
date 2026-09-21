<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\OrderShipped;
use Kirki\Ecommerce\Framework\Listener;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

/**
 * Listener for OrderShipped that is meant to record an activity log entry, currently a no-op.
 *
 * @since 1.0.0
 */
class AddActivityLog extends Listener
{
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
        // do something
        // Log::debug('Activity Log: ' . print_r($event->order, true));
    }
}
