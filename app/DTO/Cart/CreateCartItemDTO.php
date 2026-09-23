<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for creating a cart item.
 *
 * @since 1.0.0
 */
class CreateCartItemDTO extends DTO
{
    /** @var int */
    public $cart_id;

    /** @var int */
    public $product_id;

    /** @var int */
    public $variant_id;

    /** @var int */
    public $quantity;
}
