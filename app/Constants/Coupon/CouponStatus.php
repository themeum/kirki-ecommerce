<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class CouponStatus
{
    use HasConstants;
    const ACTIVE = 'active';
    const SCHEDULED = 'scheduled';
    const INACTIVE = 'inactive';
    const EXPIRED = 'expired';
}
