<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;

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

    public function execute($cart_token, $customer_id, array $data)
    {
        $cart = $this->cart_service->get_cart($customer_id, $cart_token);
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
