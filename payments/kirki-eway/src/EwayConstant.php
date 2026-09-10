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
    const PROCESS_PAYMENT = 'ProcessPayment';
    const RESPONSIVE_SHARED = 'ResponsiveShared';

    const ENDPOINT_SANDBOX = 'https://api.sandbox.ewaypayments.com/';
    const ENDPOINT_PRODUCTION = 'https://api.ewaypayments.com/';
    const POST_METHOD = 'post';
    const GET_METHOD = 'get';
    const API_ACCESS_CODE_SHARED = 'AccessCodesShared';
    const API_VERSION = 47;
}
