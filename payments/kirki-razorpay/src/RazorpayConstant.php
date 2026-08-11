<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Constants for the Razorpay Payments API integration.
 */
class RazorpayConstant
{
    use HasConstants;

    const API_URL = 'https://api.razorpay.com/v1/';
    const FORM_URL = 'https://api.razorpay.com/v1/checkout/embedded';
    const SHA256 = 'sha256';
    const JS_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
    const EVENT_PAYMENT_CAPTURED = 'payment.captured';
    const EVENT_PAYMENT_FAILED = 'payment.failed';
    const STATUS_PAYMENT_CAPTURED = 'captured';
    const STATUS_PAYMENT_FAILED = 'failed';
}
