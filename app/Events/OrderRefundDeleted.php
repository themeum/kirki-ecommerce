<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

class OrderRefundDeleted
{
    use Dispatchable;

    public Order $order;
    public array $refund_snapshot;

    public function __construct(Order $order, array $refund_snapshot)
    {
        $this->order = $order;
        $this->refund_snapshot = $refund_snapshot;
    }
}
