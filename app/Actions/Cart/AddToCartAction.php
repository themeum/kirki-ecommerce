<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\CreateCartItemDTO;
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

        if (!$variant) {
            throw new Exception(__('Variant not found.', 'kirki-ecommerce'));
        }

        $dto->product_id = $variant->product_id;

        $cart = $this->cart_service->get_cart($dto->user_id, $dto->token);
        $existing_item = $cart ? $this->cart_service->find_item_in_cart($cart->id, $dto->variant_id) : null;
        $resulting_quantity = $existing_item ? $existing_item->quantity + $dto->quantity : $dto->quantity;

        if (!$this->inventory_service->has_stock($dto->variant_id, $resulting_quantity)) {
            throw new Exception(__('Not enough stock for this variant', 'kirki-ecommerce'));
        }

        if (!$this->inventory_service->is_within_limit($dto->variant_id, $resulting_quantity)) {
            throw new Exception(sprintf(__('You can not add more than %d units of this item to cart', 'kirki-ecommerce'), $variant->max_per_order));
        }

        $cart = $cart ?: $this->cart_service->get_or_create_cart($dto->user_id, $dto->token);

        if ($existing_item) {
            $this->cart_service->update_item_quantity($cart->id, $existing_item->id, $resulting_quantity);
        } else {
            $this->cart_service->add_item_to_cart(CreateCartItemDTO::from_array([
                'cart_id' => $cart->id,
                'product_id' => $dto->product_id,
                'variant_id' => $dto->variant_id,
                'quantity' => $dto->quantity,
            ]));
        }

        return $this->cart_service->find($cart->id);
    }
}
