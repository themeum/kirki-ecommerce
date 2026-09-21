<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for removing an item from a user's or guest's cart.
 *
 * @since 1.0.0
 */
class RemoveCartItemDTO extends DTO
{
    /** @var int|null */
    public $user_id;

    /** @var string|null */
    public $token;

    /** @var int */
    public $item_id;
}
