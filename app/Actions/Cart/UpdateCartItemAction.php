<?php

namespace Kirki\Ecommerce\App\Actions\Cart;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\DTO\Cart\UpdateCartItemDTO;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Changes the quantity of a cart item after checking stock and per-order limits.
 *
 * @since 1.0.0
 */
class UpdateCartItemAction
{
    /** @var CartService */
    protected $cart_service;

    /** @var InventoryService */
    protected $inventory_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CartService      $cart_service      Cart lookup and item service.
     * @param InventoryService $inventory_service Stock and per-order limit checks.
     */
    public function __construct(
        CartService $cart_service,
        InventoryService $inventory_service
    ) {
        $this->cart_service = $cart_service;
        $this->inventory_service = $inventory_service;
    }

    /**
     * Set the quantity of a cart item.
     *
     * Fails when the cart or item is missing, stock is short, or the per-order limit is exceeded.
     *
     * @since 1.0.0
     *
     * @param UpdateCartItemDTO $dto Item ID, new quantity and cart identity (user ID or token).
     * @return \Kirki\Ecommerce\App\Models\Cart|null The refreshed cart.
     * @throws NotFoundException When the cart or cart item is not found.
     * @throws \Exception When stock is short or the per-order limit is exceeded.
     */
    public function execute(UpdateCartItemDTO $dto)
    {
        $cart = $this->cart_service->get_cart($dto->user_id, $dto->token);
        $item = $this->cart_service->find_item($dto->item_id);

        throw_if(empty($cart), __('Cart not found.', 'kirki-ecommerce'), NotFoundException::class);

        throw_if(empty($item), __('Cart item not found.', 'kirki-ecommerce'), NotFoundException::class);

        throw_if(!$this->inventory_service->has_stock($item->variant_id, $dto->quantity), __('Not enough stock for this variant', 'kirki-ecommerce'));

        /* translators: %s: variant ID */
        throw_if(!$this->inventory_service->is_within_limit($item->variant_id, $dto->quantity), sprintf(__('Max per order limit exceeded for variant: %s', 'kirki-ecommerce'), $item->variant_id));

        $this->cart_service->update_item_quantity($cart->id, $dto->item_id, $dto->quantity);

        return $this->cart_service->get_cart($dto->user_id, $dto->token);
    }
}
