<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;

class OrderListResource extends Resource
{
    public function to_array()
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'order_number' => $this->order_number,
            'customer_id' => $this->customer_id,
            'quantity' => $this->items_count,
            'total' => Money::prepare_amount($this->total, $this->currency_code),
            'total_money_object' => Money::prepare_amount_object($this->total, $this->currency_code),
            'status' => $this->order_status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'created_at' => $this->created_at,
        ];
    }
}
