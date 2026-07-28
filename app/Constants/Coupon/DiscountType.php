<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class DiscountType
{
    use HasConstants;
    const AMOUNT_OFF = 'amount-off';
    const FREE_SHIPPING = 'free-shipping';
    const BUY_X_GET_Y = 'buy-x-get-y';
}
