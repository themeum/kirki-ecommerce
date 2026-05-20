<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\DTO;

class RemoveCartItemDTO extends DTO
{
    /** @var int|null */
    public $customer_id;

    /** @var string|null */
    public $token;

    /** @var int */
    public $item_id;
}
