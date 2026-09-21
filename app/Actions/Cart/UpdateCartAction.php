<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Applies partial updates to the shopper's cart and drops a shipping method that no longer fits.
 *
 * @since 1.0.0
 */
class UpdateCartAction
{
    /** @var CartService */
    protected $cart_service;

    /** @var ShippingService */
    protected $shipping_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CartService     $cart_service     Cart lookup and update service.
     * @param ShippingService $shipping_service Shipping method validity checks.
     */
    public function __construct(
        CartService $cart_service,
        ShippingService $shipping_service
    ) {
        $this->cart_service = $cart_service;
        $this->shipping_service = $shipping_service;
    }

    /**
     * Update the cart identified by the token or user.
     *
     * Clears the cart's shipping method when it is no longer valid for the
     * updated cart. Fails with a not-found error when no cart exists.
     *
     * @since 1.0.0
     *
     * @param string|null          $cart_token Guest cart token.
     * @param array<string, mixed> $data       Cart attributes to update.
     * @param int|null             $user_id    Authenticated user ID, if any.
     * @return \Kirki\Ecommerce\App\Models\Cart|null The updated cart.
     * @throws NotFoundException When no cart exists.
     */
    public function execute($cart_token, array $data, $user_id = null)
    {
        $cart = $this->cart_service->get_cart($user_id, $cart_token);

        throw_if(empty($cart), __('Cart not found.', 'kirki-ecommerce'), NotFoundException::class);

        $cart = $this->cart_service->partial_update($cart->id, $data);
        $context = CalculationContextDTO::from_cart($cart);

        if (!$this->shipping_service->has_valid_shipping_method($context)) {
            $cart = $this->cart_service->partial_update($cart->id, [
                'shipping_method' => null,
            ]);
        }

        return $cart;
    }
}
