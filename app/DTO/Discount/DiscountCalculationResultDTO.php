<?php

namespace Kirki\Ecommerce\App\DTO\Discount;

use Kirki\Ecommerce\Framework\DTO;

class DiscountCalculationResultDTO extends DTO
{
    /** @var CouponDiscountResultDTO[] One entry per successfully applied coupon */
    public $coupon_results = [];

    /** @var \Kirki\Ecommerce\App\Models\Coupon[] Coupons that failed validation this pass and were excluded */
    public $invalid_coupons = [];

    /** @var array<int, int> Discount amount per variant_id, summed across every applied coupon */
    public $item_discounts = [];

    /** @var int Total shipping discount amount in minor units */
    public $shipping_discount = 0;
}
