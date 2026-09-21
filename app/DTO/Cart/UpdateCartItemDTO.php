<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for changing the quantity of an item in a user's or guest's cart.
 *
 * @since 1.0.0
 */
class UpdateCartItemDTO extends DTO
{
    /** @var int|null */
    public $user_id;

    /** @var string|null */
    public $token;

    /** @var int */
    public $item_id;

    /** @var int */
    public $quantity;
}
