<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Concerns\HasConstants;

class DiscountTarget
{
    use HasConstants;
    const ORDER = 'order';
    const PRODUCTS = 'products';
}
