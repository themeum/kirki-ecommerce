<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\Framework\DTO;

class CreateCartItemDTO extends DTO
{
    /**
     * @var int
     */
    public $cart_id;

    /**
     * @var int
     */
    public $product_id;

    /**
     * @var int
     */
    public $variant_id;

    /**
     * @var int
     */
    public $quantity;
}
