<?php

namespace Kirki\Ecommerce\App\Constants\Order;

final class PaymentStatus
{
    const PENDING = 'pending';
    const PROCESSING = 'processing';
    const ON_HOLD = 'on_hold';
    const PAID = 'paid';
    const FAILED = 'failed';
    const REFUNDED = 'refunded';
    const PARTIALLY_REFUNDED = 'partially_refunded';
}
