<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;

defined('ABSPATH') || exit;

/**
 * Constants for the PayU GPO Europe API integration.
 */
final class PayuConstant
{
    const PRODUCTION_BASE_URL = 'https://secure.payu.com/';
    const SANDBOX_BASE_URL = 'https://secure.snd.payu.com/';

    const OAUTH_ENDPOINT = 'pl/standard/user/oauth/authorize';
    const ORDERS_ENDPOINT = 'api/v2_1/orders';
    const GRANT_TYPE = 'client_credentials';

    const SIGNATURE_HEADERS = [
        'HTTP_OPENPAYU_SIGNATURE',
        'HTTP_X_OPENPAYU_SIGNATURE',
    ];

    const SIGNATURE_ALGORITHMS = [
        'MD5' => 'md5',
        'SHA' => 'sha256',
        'SHA1' => 'sha1',
        'SHA-1' => 'sha1',
        'SHA256' => 'sha256',
        'SHA-256' => 'sha256',
        'SHA384' => 'sha384',
        'SHA-384' => 'sha384',
        'SHA512' => 'sha512',
        'SHA-512' => 'sha512',
    ];

    const CLIENT_IP_HEADERS = [
        'HTTP_CLIENT_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_FORWARDED',
        'HTTP_X_CLUSTER_CLIENT_IP',
        'HTTP_FORWARDED_FOR',
        'HTTP_FORWARDED',
        'REMOTE_ADDR',
    ];

    const PAYMENT_STATUS_MAP = [
        'PENDING' => PaymentStatus::PENDING,
        'WAITING_FOR_CONFIRMATION' => PaymentStatus::PENDING,
        'COMPLETED' => PaymentStatus::PAID,
        'CANCELED' => PaymentStatus::CANCELLED,
    ];
}
