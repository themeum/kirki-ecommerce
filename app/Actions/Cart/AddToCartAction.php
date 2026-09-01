<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Exception;

class AddToCartAction
{
    protected $cart_service;
    protected $variant_service;
    protected $inventory_service;

    public function __construct(
        CartService $cart_service,
        VariantService $variant_service,
        InventoryService $inventory_service
    ) {
        $this->cart_service = $cart_service;
        $this->variant_service = $variant_service;
        $this->inventory_service = $inventory_service;
    }

    public function execute(AddToCartDTO $dto)
    {
        $variant = $this->variant_service->find($dto->variant_id);
        $cart = $this->cart_service->get_cart($dto->user_id, $dto->token);
        $cart_id = $cart->id ?? 0;

        $existing_item = $this->cart_service->find_item_in_cart($cart_id, $dto->variant_id);
        $quantity = $dto->quantity;

        if (!empty($existing_item)) {
            $quantity = $existing_item->quantity + $dto->quantity;
        }

        if (!$variant) {
            throw new Exception(__('Variant not found.', 'kirki-ecommerce'));
        }

        if (!$this->inventory_service->has_stock($dto->variant_id, $dto->quantity)) {
            throw new Exception(__('Not enough stock for this variant', 'kirki-ecommerce'));
        }

        if (!$this->inventory_service->is_within_limit($dto->variant_id, $quantity)) {
            throw new Exception(sprintf(__('You can not add more than %d units of this item to cart', 'kirki-ecommerce'), $variant->max_per_order));
        }

        $dto->product_id = $variant->product_id;

        $cart = $this->cart_service->add_item($dto);

        return $cart;
    }
}
