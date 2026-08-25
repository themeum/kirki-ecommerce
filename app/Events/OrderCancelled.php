<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

class OrderCancelled
{
    use Dispatchable;

    public Order $order;
    public ?string $reason;

    public function __construct(Order $order, ?string $reason = null)
    {
        $this->order = $order;
        $this->reason = $reason;
    }
}
