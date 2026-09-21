<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * How a coupon discount value is expressed: percentage or fixed amount.
 *
 * @since 1.0.0
 */
class DiscountValueType
{
    use HasConstants;
    const PERCENTAGE = 'percentage';
    const FIXED = 'fixed';
}
