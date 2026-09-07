<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the QuickPay Payments API integration.
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
}
