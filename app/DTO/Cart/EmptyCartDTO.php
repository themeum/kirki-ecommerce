<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\Framework\DTO;

class EmptyCartDTO extends DTO
{
    /** @var int|null */
    public $user_id;

    /** @var string|null */
    public $token;
}
