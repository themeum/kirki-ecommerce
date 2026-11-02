<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

/**
 * Constants for the PayMongo Payments API integration.
 */
class PaymongoConstant
{
    use HasConstants;

    const API_V2_URL = 'https://api.paymongo.com/v2';
    const API_CHECKOUT_SESSIONS_URL = self::API_V2_URL . '/checkout_sessions';

    const GET_METHOD = 'get';
    const POST_METHOD = 'post';

    /**
     * The only currency PayMongo settles in.
     */
    const CURRENCY = 'PHP';

    const SIGNATURE_HEADER = 'HTTP_PAYMONGO_SIGNATURE';

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
        'brankas_bdo',
        'brankas_landbank',
        'brankas_metrobank',
        'brankas_rcbc',
    ];

    const EVENT_CHECKOUT_PAYMENT_PAID = 'checkout_session.payment.paid';
    const EVENT_PAYMENT_PAID = 'payment.paid';
    const EVENT_PAYMENT_FAILED = 'payment.failed';
    const RESOURCE_PAYMENT = 'payment';
}
