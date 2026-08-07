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
            'customer_name' => $this->resolve_customer_name(),
            'customer_email' => $this->customer_email,
            'is_manual' => $this->is_manual,
            'quantity' => $this->items_count,
            'invoiced_total' => Money::prepare_amount_from_minor($this->invoiced_total, $this->currency_code),
            'invoiced_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_total, $this->currency_code),
            'base_total' => Money::prepare_amount_from_minor($this->base_total),
            'base_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total),
            'status' => $this->order_status,
            'fulfillment_status' => $this->fulfillment_status,
            'is_refund_initiated' => $this->is_refund_initiated,
            'payment_status' => $this->payment_status,
            'payment_provider' => $this->payment_provider,
            'created_at' => $this->created_at,
        ];
    }

    /**
     * Build the customer name from the shipping name pair.
     *
     * @return string|null
     */
    protected function resolve_customer_name()
    {
        $name = trim($this->shipping_first_name . ' ' . $this->shipping_last_name);

        return '' === $name ? null : $name;
    }
}
