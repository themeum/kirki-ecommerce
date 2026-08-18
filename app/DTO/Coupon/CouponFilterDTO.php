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

    /** @var bool|int */
    public $is_active;

    /** @var string */
    public $start_date;

    /** @var string */
    public $end_date;
}
