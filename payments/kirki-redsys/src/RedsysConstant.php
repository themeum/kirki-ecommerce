<?php

namespace Kirki\Ecommerce\Payments;

defined('ABSPATH') || exit;

/**
 * Constants for the Redsys redirect (Realizar Pago) integration.
 */
final class RedsysConstant
{
    const FORM_SANDBOX_URL = 'https://sis-t.redsys.es:25443/sis/realizarPago';
    const FORM_PRODUCTION_URL = 'https://sis.redsys.es/sis/realizarPago';

    const SIGNATURE_VERSION = 'HMAC_SHA512_V2';
    const SIGNATURE_ALGORITHM = 'sha512';

    const KEY_CIPHER = 'aes-128-cbc';
    const KEY_LENGTH = 16;

    const TRANSACTION_TYPE_AUTHORIZATION = 0;

    const ADDRESS_LINE_MAX_LENGTH = 50;

    const ORDER_NUMBER_MIN = 1000;
    const ORDER_NUMBER_MAX = 100000000000;

    /**
     * Ds_Response values up to this code mean the payment was authorized.
     */
    const RESPONSE_CODE_AUTHORIZED_MAX = 99;
}
