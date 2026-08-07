<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

final class FulfillmentStatus
{
    use HasConstants;

    const UNFULFILLED = 'unfulfilled';
    const PROCESSING = 'processing';
    const SHIPPED = 'shipped';
    const DELIVERED = 'delivered';
    const ON_HOLD = 'on-hold';
    const CANCELLED = 'cancelled';
    const RETURNED = 'returned';
}
