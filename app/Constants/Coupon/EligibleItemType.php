<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Which items a coupon is eligible for: all products, specific products or specific categories.
 *
 * @since 1.0.0
 */
class EligibleItemType
{
    use HasConstants;
    const SPECIFIC_PRODUCTS = 'specific-products';
    const SPECIFIC_CATEGORIES = 'specific-categories';
    const ALL_PRODUCTS = 'all-products';
}
