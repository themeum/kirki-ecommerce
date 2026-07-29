<?php

namespace Kirki\Ecommerce\App\Events;

use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

class OrderShipped
{
    use Dispatchable;

    public $order;

    public function __construct($order)
    {
        $this->order = $order;
    }
}
