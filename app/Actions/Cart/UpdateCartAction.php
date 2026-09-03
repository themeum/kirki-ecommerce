<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;

class UpdateCartAction
{
    protected $cart_service;
    protected $shipping_service;

    public function __construct(
        CartService $cart_service,
        ShippingService $shipping_service
    ) {
        $this->cart_service = $cart_service;
        $this->shipping_service = $shipping_service;
    }

    public function execute($cart_token, array $data, $user_id = null)
    {
        $cart = $this->cart_service->get_cart($user_id, $cart_token);

        if (empty($cart)) {
            throw new NotFoundException(__('Cart not found.', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

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
