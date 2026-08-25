<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

class OrderRefundRequested
{
    use Dispatchable;

    public Order $order;
    public Refund $refund;

    public function __construct(Order $order, Refund $refund)
    {
        $this->order = $order;
        $this->refund = $refund;
    }
}
