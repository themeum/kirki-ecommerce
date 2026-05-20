<?php

namespace Kirki\Ecommerce\App\Constants\Order;

final class OrderStatus
{
    const PENDING = 'pending';
    const PROCESSING = 'processing';
    const COMPLETED = 'completed';
    const CANCELLED = 'cancelled';
    const REFUNDED = 'refunded';
    const PARTIALLY_REFUNDED = 'partially-refunded';
    const ON_HOLD = 'on-hold';
}
