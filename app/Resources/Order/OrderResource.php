<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

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
                'subtotal' => Money::prepare_amount($this->subtotal, $this->currency_code),
                'subtotal_money_object' => Money::prepare_amount_object($this->subtotal, $this->currency_code),
                'shipping' => Money::prepare_amount($this->shipping_total, $this->currency_code),
                'shipping_money_object' => Money::prepare_amount_object($this->shipping_total, $this->currency_code),
                'discount' => Money::prepare_amount($this->discount_total, $this->currency_code),
                'discount_money_object' => Money::prepare_amount_object($this->discount_total, $this->currency_code),
                'tax' => Money::prepare_amount($this->tax_total, $this->currency_code),
                'tax_money_object' => Money::prepare_amount_object($this->tax_total, $this->currency_code),
                'total' => Money::prepare_amount($this->total, $this->currency_code),
                'total_money_object' => Money::prepare_amount_object($this->total, $this->currency_code),
            ],

            'items_count' => $this->items_count,
            'items' => $this->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'quantity' => $item->quantity,
                    'price' => Money::prepare_amount($item->price, $this->currency_code),
                    'price_money_object' => Money::prepare_amount_object($item->price, $this->currency_code),
                    'total' => Money::prepare_amount($item->total, $this->currency_code),
                    'total_money_object' => Money::prepare_amount_object($item->total, $this->currency_code),
                    'tax_rate' => $item->tax_rate,
                    'tax_total' => Money::prepare_amount($item->tax_total, $this->currency_code),
                    'tax_total_money_object' => Money::prepare_amount_object($item->tax_total, $this->currency_code),
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

            'is_billing_same_as_shipping' => $this->is_billing_same_as_shipping,

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
                    'amount' => Money::prepare_amount($refund->amount, $this->currency_code),
                    'amount_money_object' => Money::prepare_amount_object($refund->amount, $this->currency_code),
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
}
