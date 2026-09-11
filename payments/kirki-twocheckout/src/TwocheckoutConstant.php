<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the 2Checkout (Verifone) API integration.
 */
class TwocheckoutConstant
{
    use HasConstants;

    const BUY_LINK_URL = 'https://secure.2checkout.com/checkout/buy/?';
    const TYPE_PRODUCT = 'PRODUCT';
    const TYPE_TAX = 'TAX';
    const TYPE_SHIPPING = 'SHIPPING';
    const TAX = 'Tax';
    const SHIPPING_CHARGE = 'SHIPPING_CHARGE';
    const JWT_EXPIRE_TIME = 1800; // 30 min
    const ALGO = 'HS512';
    const TOKEN_TYPE = 'JWT';
    const HASH_ALGORITHM = 'sha512';
    const SIGNATURE_GENERATE_URL = 'https://secure.2checkout.com/checkout/api/encrypt/generate/signature';
    const METHOD_POST = 'post';
    const METHOD_GET = 'get';
    const DISCOUNT = 'Discount';
    const TYPE_COUPON = 'COUPON';

    //IPN ORDERSTATUS values handled by this gateway.
    const ORDER_STATUS_COMPLETE = 'COMPLETE';
    const ORDER_STATUS_PENDING = 'PENDING';
    const ORDER_STATUS_CANCELED = 'CANCELED';

    // IPN signature algorithms.
    const IPN_SIGNATURE_ALGORITHM_SHA3 = 'sha3-256';
    const IPN_SIGNATURE_ALGORITHM_SHA2 = 'sha256';
    const IPN_SIGNATURE_ALGORITHM_MD5 = 'md5';
}
