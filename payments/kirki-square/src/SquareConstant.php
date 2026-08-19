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
    const ORDER_LINK = '/v2/orders';

    const PREFIX = 'kirki-square-';
    const EVENT_PAYMENT_UPDATE = 'payment.updated';
    const SQUARE_VERSION = '2026-08-19';

    const POST_METHOD = 'post';
    const GET_METHOD = 'get';

    const PAYMENT_APPROVED = 'APPROVED';
    const PAYMENT_PENDING = 'PENDING';
    const PAYMENT_COMPLETED = 'COMPLETED';
    const PAYMENT_CANCELED = 'CANCELED';
    const PAYMENT_FAILED = 'FAILED';
}
