<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the Square Payments API integration.
 */
class RedsysConstant
{
    use HasConstants;

    const SANDBOX_URL = "https://sis-t.redsys.es:25443/sis/realizarPago";
    const PRODUCTION_URL = "https://sis.redsys.es/sis/realizarPago";
    const SIGNATURE_VERSION = "HMAC_SHA512_V2";
}
