<?php

namespace Kirki\Ecommerce\App\Constants\Order;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

final class PaymentStatus
{
    use HasConstants;

    const PAID = 'paid';
    const UNPAID = 'unpaid';
    const FAILED = 'failed';

    // @todo: need to implement refund logics later, now just defined
    const REFUNDING = 'refunding';
    const REFUNDED = 'refunded';
}
