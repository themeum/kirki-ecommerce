<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\DTO\Cart\RemoveCartItemDTO;

/**
 * Removes a single item from the shopper's cart.
 *
 * @since 1.0.0
 */
class RemoveCartItemAction
{
    /** @var CartService */
    protected $cart_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CartService $cart_service Cart item removal service.
     */
    public function __construct(
        CartService $cart_service
    ) {
        $this->cart_service = $cart_service;
    }

    /**
     * Remove the item from the cart.
     *
     * Removing the last item deletes the cart itself, in which case no cart
     * is returned.
     *
     * @since 1.0.0
     *
     * @param RemoveCartItemDTO $dto Item ID and cart identity (user ID or token).
     * @return \Kirki\Ecommerce\App\Models\Cart|null The remaining cart, or null when it no longer exists.
     */
    public function execute(RemoveCartItemDTO $dto)
    {
        $this->cart_service->remove_item($dto);

        return $this->cart_service->get_cart($dto->user_id, $dto->token);
    }
}
