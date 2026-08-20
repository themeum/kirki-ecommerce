<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class CustomerExcludeEligibility
{
    use HasConstants;
    const NONE = 'none';
    const SPECIFIC_CUSTOMERS = 'specific-customers';
    const SPECIFIC_GROUPS = 'specific-groups';
    const CUSTOMERS = 'customers';
    const GUESTS = 'guests';
}
