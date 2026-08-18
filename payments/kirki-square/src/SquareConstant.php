<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the Razorpay Payments API integration.
 */
class SquareConstant
{
    use HasConstants;

    const PRODUCTION_BASE_URL = "https://connect.squareup.com";
    const SANDBOX_BASE_URL = "https://connect.squareupsandbox.com";
    const PAYMENT_LINK = "/v2/online-checkout/payment-links";
    const PREFIX = 'kirki-square-';
}
