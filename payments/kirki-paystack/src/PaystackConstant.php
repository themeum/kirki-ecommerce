<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the Square Payments API integration.
 */
class PaystackConstant
{
    use HasConstants;

    const BASE_URL = 'https://api.paystack.co';

    const POST_METHOD = 'post';
    const GET_METHOD = 'get';

    const STATUS_MAP = [
        'success'   => PaymentStatus::PAID,
        'failed'    => PaymentStatus::FAILED,
        'abandoned' => PaymentStatus::UNPAID,
        'ongoing' => PaymentStatus::UNPAID,
        'pending' => PaymentStatus::UNPAID,
        'processing' => PaymentStatus::UNPAID,
    ];
}
