<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Cart\UpdateCartDTO;

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

    public function execute(UpdateCartDTO $dto)
    {
        $cart = $this->cart_service->update_cart($dto);
        $context = CalculationContextDTO::from_cart($cart);

        if (!$this->shipping_service->has_valid_shipping_method($context)) {
            $dto->shipping_method = null;
            $cart = $this->cart_service->update_cart($dto);
        }

        return $cart;
    }
}
