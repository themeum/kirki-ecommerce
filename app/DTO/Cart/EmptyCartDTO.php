<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object identifying the cart, by user or guest token, that should be emptied.
 *
 * @since 1.0.0
 */
class EmptyCartDTO extends DTO
{
    /** @var int|null */
    public $user_id;

    /** @var string|null */
    public $token;
}
