<?php

namespace Kirki\Ecommerce\App\DTO\Discount;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Combined outcome of applying every coupon: per-coupon results, invalid coupons and summed discounts.
 *
 * @since 1.0.0
 */
class DiscountCalculationResultDTO extends DTO
{
    /** @var CouponDiscountResultDTO[] One entry per successfully applied coupon */
    public $coupon_results = [];

    /** @var \Kirki\Ecommerce\App\Models\Coupon[] Coupons that failed validation this pass and were excluded */
    public $invalid_coupons = [];

    /** @var array<int|string, int> Discount amount per line key, summed across every applied coupon */
    public $item_discounts = [];

    /** @var array<int|string, int> The part of item_discounts that came from product-scoped coupons, per line key */
    public $product_item_discounts = [];

    /** @var int Total shipping discount amount in minor units */
    public $shipping_discount = 0;
}
