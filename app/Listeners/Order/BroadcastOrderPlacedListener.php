<?php

namespace Kirki\Ecommerce\App\Listeners\Order;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Events\Order\OrderPlacedEvent;
use Kirki\Ecommerce\Framework\Listener;

/**
 * Listener for OrderPlacedEvent that exposes the placed order to third-party
 * code through the `kirki_ecommerce_order_placed` WordPress action.
 *
 * @since 1.0.0
 */
class BroadcastOrderPlacedListener extends Listener
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
        do_action(DevHookNames::ORDER_PLACED, $event->order->id, $event->order);
    }
}
