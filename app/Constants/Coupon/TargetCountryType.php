<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Country targeting modes for a coupon: all or specific countries.
 *
 * @since 1.0.0
 */
class TargetCountryType
{
    use HasConstants;
    const ALL_COUNTRIES = 'all-countries';
    const SPECIFIC_COUNTRIES = 'specific-countries';
}
