<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;

defined('ABSPATH') || exit;

/**
 * Constants for the PayFast payment gateway integration.
 */
final class PayfastConstant
{
    const SANDBOX_FORM_URL = 'https://sandbox.payfast.co.za/eng/process';
    const PRODUCTION_FORM_URL = 'https://www.payfast.co.za/eng/process';
    const SANDBOX_VALIDATE_URL = 'https://sandbox.payfast.co.za/eng/query/validate';
    const PRODUCTION_VALIDATE_URL = 'https://www.payfast.co.za/eng/query/validate';

    const VALID_RESPONSE = 'VALID';

    const NOTIFICATION_HOSTS = [
        'www.payfast.co.za',
        'sandbox.payfast.co.za',
        'w1w.payfast.co.za',
        'w2w.payfast.co.za',
    ];

    const AMOUNT_TOLERANCE = 0.01;

    const PAYMENT_STATUS_MAP = [
        'COMPLETE' => PaymentStatus::PAID,
        'CANCELLED' => PaymentStatus::CANCELLED,
    ];

    const CURRENCY = 'ZAR';
}
