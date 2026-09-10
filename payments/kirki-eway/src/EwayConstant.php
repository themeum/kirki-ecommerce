<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the QuickPay Payments API integration.
 */
class EwayConstant
{
    use HasConstants;

    const TRANSACTION_TYPE_PURCHASE = 'Purchase';
}
