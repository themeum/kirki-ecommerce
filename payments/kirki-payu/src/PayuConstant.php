<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the Square Payments API integration.
 */
class PayuConstant
{
    use HasConstants;

    const POST_METHOD = 'post';
    const GET_METHOD = 'get';
    const PRODUCTION_BASE_URL = 'https://secure.payu.com/';
    const SANDBOX_BASE_URL = 'https://secure.snd.payu.com/';
    const CLIENT_CREDENTIAL = 'client_credentials';
    const OAUTH_CONTEXT = 'pl/standard/user/oauth/authorize';
    const API_VERSION = 'api/v2_1/';

    const ALGORITHMS_TO_HASH = [
        'SHA' => 'SHA256',
        'SHA-1' => 'SHA1',
        'SHA-256' => 'SHA256',
        'SHA-384' => 'SHA384',
        'SHA-512' => 'SHA512',
    ];
    const STATUS_MAP = [
        'PENDING' => PaymentStatus::PENDING,
        'WAITING_FOR_CONFIRMATION' => PaymentStatus::PENDING,
        'COMPLETED' => PaymentStatus::PAID,
        'CANCELED' => PaymentStatus::CANCELLED
    ];
}
