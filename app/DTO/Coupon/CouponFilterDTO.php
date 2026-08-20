<?php

namespace Kirki\Ecommerce\App\DTO\Coupon;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

class CouponFilterDTO extends ListFilterDTO
{
    /** @var string */
    public $status;

    /** @var string */
    public $method;

    /** @var string */
    public $discount_type;

    /** @var bool */
    public $is_active;
}
