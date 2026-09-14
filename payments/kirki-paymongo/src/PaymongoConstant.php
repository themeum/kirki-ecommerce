<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the QuickPay Payments API integration.
 */
class PayMongoConstant
{
    use HasConstants;

    const API_V2_URL = 'https://api.paymongo.com/v2';
    const API_CHECKOUT_SESSIONS_URL = self::API_V2_URL . '/checkout_sessions';

    const GET_METHOD = 'get';
    const POST_METHOD = 'post';

    const ALLOWED_PAYMENT_METHODS = [
        'card',
        'gcash',
        'qrph',
        'grab_pay',
        'paymaya',
        'shopee_pay',
        'google_pay_card',
        'dob',
        'dob_ubp',
        'billease',
        'brankas_bdo',
        'brankas_landbank',
        'brankas_metrobank',
        'brankas_rcbc',
    ];
}
