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

        if (!$variant) {
            throw new Exception(__('Variant not found.', 'kirki-ecommerce'));
        }

        if (!$this->inventory_service->has_stock($dto->variant_id, $dto->quantity)) {
            throw new Exception(__('Not enough stock for this variant', 'kirki-ecommerce'));
        }

        if (!$this->inventory_service->is_within_limit($dto->variant_id, $dto->quantity)) {
            throw new Exception(sprintf(__('Max per order limit exceeded for variant: %s', 'kirki-ecommerce'), $dto->variant_id));
        }

        $dto->product_id = $variant->product_id;

        $cart = $this->cart_service->add_item($dto);

        return $cart;
    }
}
