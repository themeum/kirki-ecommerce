<?php

namespace Kirki\Ecommerce\App\DTO\Cart;

use Kirki\Ecommerce\DTO;

class UpdateCartDTO extends DTO
{
    /** @var array|null */
    public $shipping_address;

    /** @var array|null */
    public $billing_address;

    /** @var string */
    public $shipping_method;

    /** @var string|null */
    public $coupon_code;

    /** @var string|null */
    public $customer_notes;

    /** @var int|null */
    public $customer_id;

    /** @var string|null */
    public $token;
}
