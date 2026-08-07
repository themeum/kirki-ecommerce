<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class MollieConstant
{
    use HasConstants;

    const API_KEY_PATTERN = '/^(live|test)_\w{30,}$/';
    const API_BASE_URL = 'https://api.mollie.com/v2/';
    const PAYMENT_STATUS_CANCELED = 'canceled';
    const PAYMENT_STATUS_EXPIRED = 'expired';
    const PAYMENT_STATUS_PENDING = 'pending';
    const PAYMENT_STATUS_PAID = 'paid';
    const PAYMENT_STATUS_FAILED = 'failed';
}
