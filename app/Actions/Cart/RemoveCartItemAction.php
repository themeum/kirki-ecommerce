<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\DTO\Cart\RemoveCartItemDTO;

class RemoveCartItemAction
{
    protected $cart_service;

    public function __construct(
        CartService $cart_service
    ) {
        $this->cart_service = $cart_service;
    }

    public function execute(RemoveCartItemDTO $dto)
    {
        $this->cart_service->remove_item($dto);

        return $this->cart_service->get_cart($dto->user_id, $dto->token);
    }
}
