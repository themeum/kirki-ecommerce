<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\Framework\DTO;

class RemoveCartItemDTO extends DTO
{
    /** @var int|null */
    public $user_id;

    /** @var string|null */
    public $token;

    /** @var int */
    public $item_id;
}
