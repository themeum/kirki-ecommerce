<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * What a coupon discount applies to: the whole order or specific products.
 *
 * @since 1.0.0
 */
class DiscountTarget
{
    use HasConstants;
    const ORDER = 'order';
    const PRODUCTS = 'products';
}
