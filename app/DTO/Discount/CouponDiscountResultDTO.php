<?php

namespace Kirki\Ecommerce\App\DTO\Discount;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\Framework\DTO;

class CouponDiscountResultDTO extends DTO
{
    /** @var Coupon */
    public $coupon;

    /** @var array<int, int> Discount amount per variant_id, in minor units */
    public $item_discounts = [];

    /** @var int */
    public $shipping_discount = 0;

    /** @var int */
    public $total_discount = 0;
}
