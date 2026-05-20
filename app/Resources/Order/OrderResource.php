<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\Resource;
use Kirki\Ecommerce\Supports\Facades\Money;
use Kirki\Ecommerce\Supports\MediaAttachment;

class OrderResource extends Resource
{
    public function to_array()
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'order_number' => $this->order_number,
            'customer_id' => $this->customer_id,
            'status' => $this->order_status,
            'currency_code' => $this->currency_code,

            'totals' => [
                'subtotal' => $this->prepare_amount($this->subtotal),
                'shipping' => $this->prepare_amount($this->shipping_total),
                'discount' => $this->prepare_amount($this->discount_total),
                'tax' => $this->prepare_amount($this->tax_total),
                'total' => $this->prepare_amount($this->total),
            ],

            'items_count' => $this->items_count,
            'items' => $this->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'quantity' => $item->quantity,
                    'price' => $this->prepare_amount($item->price),
                    'total' => $this->prepare_amount($item->total),
                    'tax_rate' => $item->tax_rate,
                    'tax_total' => $this->prepare_amount($item->tax_total),
                    'tax_breakdown' => $item->tax_breakdown,
                    'sku' => $item->sku,
                    'image' => MediaAttachment::make($item->product_image),
                ];
            }),

            'shipping_address' => [
                'first_name' => $this->shipping_first_name,
                'last_name' => $this->shipping_last_name,
                'line1' => $this->shipping_address_line1,
                'line2' => $this->shipping_address_line2,
                'city' => $this->shipping_city,
                'state' => $this->shipping_state,
                'country' => $this->shipping_country,
                'postal_code' => $this->shipping_postal_code,
                'phone' => $this->shipping_phone,
                'email' => $this->shipping_email,
            ],

            'billing_address' => [
                'first_name' => $this->billing_first_name,
                'last_name' => $this->billing_last_name,
                'line1' => $this->billing_address_line1,
                'line2' => $this->billing_address_line2,
                'city' => $this->billing_city,
                'state' => $this->billing_state,
                'country' => $this->billing_country,
                'postal_code' => $this->billing_postal_code,
                'phone' => $this->billing_phone,
                'email' => $this->billing_email,
            ],

            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'shipping_method' => $this->shipping_method,
            'customer_notes' => $this->customer_notes,

            'refunds' => empty($this->refunds) ? [] : $this->refunds->map(function ($refund) {
                return [
                    'id' => $refund->id,
                    'amount' => $this->prepare_amount($refund->amount),
                    'reason' => $refund->reason,
                    'transaction_id' => $refund->transaction_id,
                    'status' => $refund->status,
                    'created_at' => $refund->created_at,
                    'created_by' => $refund->created_by,
                ];
            }),

            'created_at' => $this->created_at,
        ];
    }

    protected function prepare_amount($amount)
    {
        return Money::from_minor($amount, $this->currency_code)->getAmount();
    }
}
