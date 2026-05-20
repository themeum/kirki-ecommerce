<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\DTO;

class AddToCartDTO extends DTO
{
    /**
     * @var int|null
     */
    public $customer_id;

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
