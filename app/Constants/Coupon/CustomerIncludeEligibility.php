<?php

namespace Kirki\Ecommerce\App\Constants\Coupon;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Customer eligibility options for choosing who a coupon applies to.
 *
 * @since 1.0.0
 */
class CustomerIncludeEligibility
{
    use HasConstants;
    const EVERYONE = 'everyone';
    const SPECIFIC_CUSTOMERS = 'specific-customers';
    const SPECIFIC_GROUPS = 'specific-groups';
    const CUSTOMERS = 'customers';
    const GUESTS = 'guests';
}
