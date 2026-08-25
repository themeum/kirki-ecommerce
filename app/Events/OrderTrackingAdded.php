<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

class OrderTrackingAdded
{
    use Dispatchable;

    public Order $order;
    public array $tracking;

    public function __construct(Order $order, array $tracking)
    {
        $this->order = $order;
        $this->tracking = $tracking;
    }
}
