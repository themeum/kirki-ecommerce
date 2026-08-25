<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

class OrderPaymentCompleted
{
    use Dispatchable;

    public Order $order;
    public ?string $provider;

    public function __construct(Order $order, ?string $provider = null)
    {
        $this->order = $order;
        $this->provider = $provider;
    }
}
