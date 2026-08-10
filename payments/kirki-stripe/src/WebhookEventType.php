<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class WebhookEventType
{
    use HasConstants;

    const CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed';
    const CHECKOUT_SESSION_ASYNC_PAYMENT_SUCCEEDED = 'checkout.session.async_payment_succeeded';
    const CHECKOUT_SESSION_ASYNC_PAYMENT_FAILED = 'checkout.session.async_payment_failed';
    const CHARGE_REFUNDED = 'charge.refunded';
    const CHARGE_DISPUTE_CREATED = 'charge.dispute.created';
    const CHARGE_DISPUTE_CLOSED = 'charge.dispute.closed';
    const CHARGE_UPDATED = 'charge.updated';
}
