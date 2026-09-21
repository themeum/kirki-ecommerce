<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Lifecycle statuses of a coupon.
 *
 * @since 1.0.0
 */
class CouponStatus
{
    use HasConstants;
    const ACTIVE = 'active';
    const SCHEDULED = 'scheduled';
    const INACTIVE = 'inactive';
    const EXPIRED = 'expired';
}
