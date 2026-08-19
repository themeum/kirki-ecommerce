<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the Razorpay Payments API integration.
 */
class KlarnaConstant
{
    use HasConstants;

    public const API_URLS = array(
        'eu' => array(
            'production' => 'https://api.klarna.com/',
            'sandbox' => 'https://api.playground.klarna.com/',
        ),
        'na' => array(
            'production' => 'https://api-na.klarna.com/',
            'sandbox' => 'https://api-na.playground.klarna.com/',
        ),
        'oc' => array(
            'production' => 'https://api-oc.klarna.com/',
            'sandbox' => 'https://api-oc.playground.klarna.com/',
        ),
    );

    public const PAYMENT_SESSION = 'payments/v1/sessions';
    public const HPP_SESSION = 'hpp/v1/sessions';
    public const ORDER = 'ordermanagement/v1/orders/';

    public const SANDBOX = 'sandbox';
    public const PRODUCTION = 'production';

    public const STATUS_COMPLETED = 'COMPLETED';
    public const STATUS_CANCELED = 'CANCELED';
    public const STATUS_FAILED = 'FAILED';

    public const ORDER_CAPTURED = 'CAPTURED';
    public const ORDER_CANCELLED = 'CANCELLED';
    public const ORDER_EXPIRED = 'EXPIRED';
    public const ORDER_CLOSED = 'CLOSED';
}
