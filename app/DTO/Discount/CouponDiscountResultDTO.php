<?php

namespace Kirki\Ecommerce\App\DTO\Discount;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\Framework\DTO;

/**
 * Discount amounts one coupon produced for cart items and shipping.
 *
 * @since 1.0.0
 */
class CouponDiscountResultDTO extends DTO
{
    /** @var Coupon */
    public $coupon;

    /** @var OrderCoupon|null Order coupon this result was priced from, when the coupon stays on an edited order; null for a coupon priced from the coupon record */
    public $order_coupon;

    /** @var array<int|string, int> Discount amount per line key, in minor units */
    public $item_discounts = [];

    /** @var int */
    public $shipping_discount = 0;

    /** @var int */
    public $total_discount = 0;
}
