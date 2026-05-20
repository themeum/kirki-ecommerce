<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Concerns\HasConstants;

class SpendConditionType
{
    use HasConstants;
    const MIN_CART_AMOUNT = 'min-cart-amount';
    const MIN_ITEMS = 'min-items';
}
