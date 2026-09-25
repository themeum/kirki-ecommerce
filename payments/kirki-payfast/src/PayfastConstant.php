<?php
namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\Framework\Concerns\HasConstants;

defined('ABSPATH') || exit;

/**
 * Constants for the PayMongo Payments API integration.
 */
class PayfastConstant
{
    use HasConstants;

    const SANDBOX_FORM_URL = 'https://sandbox.payfast.co.za/eng/process';
    const PRODUCTION_FORM_URL = 'https://www.payfast.co.za/eng/process';
    const SANDBOX_SERVER_CONFIRMATION_URL = 'https://sandbox.payfast.co.za/eng/query/validate';
    const PRODUCTION_SERVER_CONFIRMATION_URL = 'https://www.payfast.co.za/eng/query/validate';

    const PAYMENT_STATUS = [
        'COMPLETE' => PaymentStatus::PAID,
        'CANCELLED' => PaymentStatus::CANCELLED,
    ];
}
