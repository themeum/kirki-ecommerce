<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Customer eligibility options for excluding customers from a coupon.
 *
 * @since 1.0.0
 */
class CustomerExcludeEligibility
{
    use HasConstants;
    const NONE = 'none';
    const SPECIFIC_CUSTOMERS = 'specific-customers';
    const SPECIFIC_GROUPS = 'specific-groups';
    const CUSTOMERS = 'customers';
    const GUESTS = 'guests';
}
