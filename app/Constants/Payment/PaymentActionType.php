<?php

namespace Kirki\Ecommerce\App\Constants\Payment;

/**
 * Kinds of follow-up action a payment provider asks the client to take: redirect or render HTML.
 *
 * @since 1.0.0
 */
final class PaymentActionType
{
    const REDIRECT = 'redirect';
    const HTML = 'html';
}
