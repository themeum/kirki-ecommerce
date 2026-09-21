<?php

namespace Kirki\Ecommerce\App\DTO\Coupon;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

/**
 * Filters for listing coupons, adding status, method and discount type to the shared list filters.
 *
 * @since 1.0.0
 */
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
