<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class TargetCountryType
{
    use HasConstants;
    const ALL_COUNTRIES = 'all-countries';
    const SPECIFIC_COUNTRIES = 'specific-countries';
}
