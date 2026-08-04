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
            'total' => $this->prepare_amount($this->total_base),
            'status' => $this->order_status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'created_at' => $this->created_at,
        ];
    }

    protected function prepare_amount($amount)
    {
        $value = Money::convert_to_currency(Money::from_minor($amount), $this->currency_code)->getMinorAmount();
        
        return Money::to_dto($value, $this->currency_code);
    }
}
