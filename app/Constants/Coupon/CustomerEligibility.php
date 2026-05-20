<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Concerns\HasConstants;

class CustomerEligibility
{
    use HasConstants;
    const ALL = 'all';
    const SPECIFIC_CUSTOMERS = 'specific-customers';
    const SPECIFIC_GROUPS = 'specific-groups';
}
