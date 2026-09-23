<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\DTO\Cart\CreateCartItemDTO;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Adds a variant to the shopper's cart, creating the cart when none exists.
 *
 * @since 1.0.0
 */
class AddToCartAction
{
    /** @var CartService */
    protected $cart_service;

    /** @var VariantService */
    protected $variant_service;

    /** @var InventoryService */
    protected $inventory_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CartService      $cart_service      Cart lookup and item service.
     * @param VariantService   $variant_service   Variant lookup service.
     * @param InventoryService $inventory_service Stock and per-order limit checks.
     */
    public function __construct(
        CartService $cart_service,
        VariantService $variant_service,
        InventoryService $inventory_service
    ) {
        $this->cart_service = $cart_service;
        $this->variant_service = $variant_service;
        $this->inventory_service = $inventory_service;
    }

    /**
     * Add the requested quantity of a variant to the cart.
     *
     * Increases the quantity of an existing line for the same variant. Fails
     * when the variant is missing, stock is short, or the per-order limit is
     * exceeded by the resulting quantity.
     *
     * @since 1.0.0
     *
     * @param AddToCartDTO $dto Variant, quantity and cart identity (user ID or token).
     * @return \Kirki\Ecommerce\App\Models\Cart|null The refreshed cart.
     * @throws \Exception When the variant is not found, stock is short, or the per-order limit is exceeded.
     */
    public function execute(AddToCartDTO $dto)
    {
        $variant = $this->variant_service->find($dto->variant_id);

        throw_if(!$variant, __('Variant not found.', 'kirki-ecommerce'), ValidationException::class, Response::NOT_FOUND);
        throw_if(!$variant->is_available(), __('This item is no longer available.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        $dto->product_id = $variant->product_id;

        $cart = $this->cart_service->get_cart($dto->user_id, $dto->token);
        $existing_item = $cart ? $this->cart_service->find_item_in_cart($cart->id, $dto->variant_id) : null;
        $resulting_quantity = $existing_item ? $existing_item->quantity + $dto->quantity : $dto->quantity;

        throw_if(!$this->inventory_service->has_stock($dto->variant_id, $resulting_quantity), __('Not enough stock for this variant', 'kirki-ecommerce'));

        /* translators: %d: maximum allowed quantity per order */
        throw_if(!$this->inventory_service->is_within_limit($dto->variant_id, $resulting_quantity), sprintf(__('You can not add more than %d units of this item to cart', 'kirki-ecommerce'), $variant->max_per_order));

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
