<?php

namespace Kirki\Ecommerce\App\Listeners;

use Kirki\Ecommerce\App\Events\AddressUpdatedEvent;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\Framework\Listener;

use function Kirki\Ecommerce\Framework\app;

/**
 * Listener for AddressUpdatedEvent that keeps the customer's cart addresses in sync with the saved address.
 *
 * @since 1.0.0
 */
class SyncCartAddressListener extends Listener
{
    /**
     * Refresh the cart's shipping and billing address when it references the updated address.
     *
     * @since 1.0.0
     *
     * @param AddressUpdatedEvent $event The dispatched event.
     * @return void
     */
    public function handle(AddressUpdatedEvent $event)
    {
        $cart_service = app()->make(CartService::class);
        $cart = $cart_service->get_cart($event->address->customer->user_id);

        if (!empty($cart) && $cart->shipping_address['id'] === $event->address->id) {
            $cart_service->partial_update($cart->id, [
                'shipping_address' => $event->address,
            ]);
        }

        if (!empty($cart) && $cart->billing_address['id'] === $event->address->id) {
            $cart_service->partial_update($cart->id, [
                'billing_address' => $event->address,
            ]);
        }
    }
}
