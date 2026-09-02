<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the QuickPay Payments API integration.
 */
class QuickpayConstant
{
    use HasConstants;

    const API_URL     = 'https://api.quickpay.net/';
    const API_VERSION = '10';

    const POST_METHOD = 'post';
    const GET_METHOD = 'get';
    const PUT_METHOD = 'put';

    const PAYMENT_CAPTURE = 'capture';
}
