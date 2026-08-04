<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class AuthorizenetConstant
{
    use HasConstants;

    const FORM_URL_SANDBOX = 'https://test.authorize.net/payment/payment';
    const FORM_URL_PRODUCTION = 'https://accept.authorize.net/payment/payment';
    const RESULT_CODE_ERROR = 'Error';
    const WEBHOOK_CAPTURE_CREATED = 'net.authorize.payment.authcapture.created';
    const WEBHOOK_VOID_CREATED = 'net.authorize.payment.void.created';
    const SANDBOX_API_ENDPOINT = 'https://apitest.authorize.net/xml/v1/request.api';
    const PRODUCTION_API_ENDPOINT = 'https://api.authorize.net/xml/v1/request.api';
    const PAID = 'paid';
    const CANCELED = 'canceled';
    const FAILED = 'failed';
    const PENDING = 'pending';
    const CAPTURED_PENDING_SETTLEMENT = 'capturedPendingSettlement';
    const DECLINED = 'declined';
    const VOIDED = 'voided';
}
