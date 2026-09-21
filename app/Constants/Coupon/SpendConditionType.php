<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Minimum spend conditions a coupon can require: cart amount or item count.
 *
 * @since 1.0.0
 */
class SpendConditionType
{
    use HasConstants;
    const MIN_CART_AMOUNT = 'min-cart-amount';
    const MIN_ITEMS = 'min-items';
}
