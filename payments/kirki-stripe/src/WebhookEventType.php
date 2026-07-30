<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class WebhookEventType
{
    use HasConstants;

    const CHARGE_REFUNDED = 'charge.refunded';
    const CHARGE_SUCCEEDED = 'charge.succeeded';
    const CHARGE_UPDATED = 'charge.updated';
    const PAYMENT_INTENT_CANCELED = 'payment_intent.canceled';
    const PAYMENT_INTENT_FAILED = 'payment_intent.payment_failed';
}
