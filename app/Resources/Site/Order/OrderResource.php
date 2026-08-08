<?php

namespace Kirki\Ecommerce\App\Resources\Site\Order;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Resources\Order\OrderResource as BaseOrderResource;

class OrderResource extends BaseOrderResource
{
    public function to_array()
    {
        return array_merge(parent::to_array(), [
            'payment_next_step' => Payment::pay($this->resource),
        ]);
    }
}
