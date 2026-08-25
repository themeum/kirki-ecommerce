<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

class OrderPaymentFailed
{
    use Dispatchable;

    public Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }
}
