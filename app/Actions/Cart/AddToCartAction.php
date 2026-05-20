<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Exception;

class AddToCartAction
{
    protected $cart_service;
    protected $variant_service;

    public function __construct(
        CartService $cart_service,
        VariantService $variant_service
    ) {
        $this->cart_service = $cart_service;
        $this->variant_service = $variant_service;
    }

    public function execute(AddToCartDTO $dto)
    {
        $variant = $this->variant_service->find($dto->variant_id);

        if (!$variant) {
            throw new Exception(__('Variant not found.', 'kirki-ecommerce'));
        }

        $dto->product_id = $variant->product_id;

        $cart = $this->cart_service->add_item($dto);

        return $cart;
    }
}
