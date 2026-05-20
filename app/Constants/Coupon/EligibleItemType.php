<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Concerns\HasConstants;

class EligibleItemType
{
    use HasConstants;
    const SPECIFIC_PRODUCTS = 'specific-products';
    const SPECIFIC_CATEGORIES = 'specific-categories';
    const ALL_PRODUCTS = 'all-products';
}
