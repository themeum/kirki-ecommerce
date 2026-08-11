<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\Framework\DTO;

class EmptyCartDTO extends DTO
{
    /** @var int|null */
    public $customer_id;

    /** @var string|null */
    public $token;
}
