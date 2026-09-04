<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Exception;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\DTO\Cart\UpdateCartItemDTO;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\App\Supports\ExceptionThrower;

class UpdateCartItemAction
{
    protected $cart_service;
    protected $inventory_service;

    public function __construct(
        CartService $cart_service,
        InventoryService $inventory_service
    ) {
        $this->cart_service = $cart_service;
        $this->inventory_service = $inventory_service;
    }

    public function execute(UpdateCartItemDTO $dto)
    {
        $cart = $this->cart_service->get_cart($dto->user_id, $dto->token);
        $item = $this->cart_service->find_item($dto->item_id);

        if (empty($cart)) {
            ExceptionThrower::throw(new NotFoundException(__('Cart not found.', 'kirki-ecommerce')));
        }

        if (empty($item)) {
            ExceptionThrower::throw(new NotFoundException(__('Cart item not found.', 'kirki-ecommerce')));
        }

        if (!$this->inventory_service->has_stock($item->variant_id, $dto->quantity)) {
            ExceptionThrower::throw(new Exception(__('Not enough stock for this variant', 'kirki-ecommerce')));
        }

        if (!$this->inventory_service->is_within_limit($item->variant_id, $dto->quantity)) {
            /* translators: %s: variant ID */
            ExceptionThrower::throw(new Exception(sprintf(__('Max per order limit exceeded for variant: %s', 'kirki-ecommerce'), $item->variant_id)));
        }

        $this->cart_service->update_item_quantity($cart->id, $dto->item_id, $dto->quantity);

        return $this->cart_service->get_cart($dto->user_id, $dto->token);
    }
}
