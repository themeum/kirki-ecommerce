<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Kinds of coupon discount: amount off, free shipping or buy X get Y.
 *
 * @since 1.0.0
 */
class DiscountType
{
    use HasConstants;
    const AMOUNT_OFF = 'amount-off';
    const FREE_SHIPPING = 'free-shipping';
    const BUY_X_GET_Y = 'buy-x-get-y';
}
