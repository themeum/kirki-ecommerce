<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\Framework\DTO;

class AddToCartDTO extends DTO
{
    /**
     * @var int|null
     */
    public $user_id;

    /**
     * @var string|null
     */
    public $token;

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
    public $quantity = 1;
}
