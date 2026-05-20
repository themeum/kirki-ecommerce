<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\DTO\Cart\UpdateCartItemDTO;

class UpdateCartItemAction
{
    protected $cart_service;

    public function __construct(
        CartService $cart_service
    ) {
        $this->cart_service = $cart_service;
    }

    public function execute(UpdateCartItemDTO $dto)
    {
        $cart = $this->cart_service->get_cart($dto->customer_id, $dto->token);

        $this->cart_service->update_item_quantity($cart->id, $dto->item_id, $dto->quantity);

        return $this->cart_service->get_cart($dto->customer_id, $dto->token);
    }
}
