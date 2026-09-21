<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * How a coupon is redeemed: by entering a code or applied automatically.
 *
 * @since 1.0.0
 */
class CouponMethod
{
    use HasConstants;
    const CODE = 'code';
    const AUTOMATIC = 'automatic';
}
