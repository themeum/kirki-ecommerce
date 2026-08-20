<?php

namespace Kirki\Ecommerce\App\Resources\Site\Account;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Resource;
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
            'fulfillment_status' => $this->fulfillment_status,
            'is_refund_initiated' => $this->is_refund_initiated,
            'is_manual' => $this->is_manual,
            'currency_code' => $this->currency_code,

            'totals' => [
                'invoiced_subtotal' => Money::prepare_amount_from_minor($this->invoiced_subtotal, $this->currency_code),
                'invoiced_subtotal_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_subtotal, $this->currency_code),
                'base_subtotal' => Money::prepare_amount_from_minor($this->base_subtotal),
                'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($this->base_subtotal),
                'invoiced_shipping' => Money::prepare_amount_from_minor($this->invoiced_shipping_total, $this->currency_code),
                'invoiced_shipping_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_shipping_total, $this->currency_code),
                'base_shipping' => Money::prepare_amount_from_minor($this->base_shipping_total),
                'base_shipping_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_total),
                'invoiced_discount' => Money::prepare_amount_from_minor($this->invoiced_discount_total, $this->currency_code),
                'invoiced_discount_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_discount_total, $this->currency_code),
                'base_discount' => Money::prepare_amount_from_minor($this->base_discount_total),
                'base_discount_money_object' => Money::prepare_amount_object_from_minor($this->base_discount_total),
                'discount_details' => $this->discount_details,
                'invoiced_tax' => Money::prepare_amount_from_minor($this->invoiced_tax_total, $this->currency_code),
                'invoiced_tax_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_tax_total, $this->currency_code),
                'base_tax' => Money::prepare_amount_from_minor($this->base_tax_total),
                'base_tax_money_object' => Money::prepare_amount_object_from_minor($this->base_tax_total),
                'invoiced_total' => Money::prepare_amount_from_minor($this->invoiced_total, $this->currency_code),
                'invoiced_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_total, $this->currency_code),
                'base_total' => Money::prepare_amount_from_minor($this->base_total),
                'base_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total),
            ],

            'items_count' => $this->items_count,
            'items' => $this->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'quantity' => $item->quantity,
                    'invoiced_price' => Money::prepare_amount_from_minor($item->invoiced_price, $this->currency_code),
                    'invoiced_price_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_price, $this->currency_code),
                    'base_price' => Money::prepare_amount_from_minor($item->base_price),
                    'base_price_money_object' => Money::prepare_amount_object_from_minor($item->base_price),
                    'invoiced_subtotal' => Money::prepare_amount_from_minor($item->invoiced_subtotal, $this->currency_code),
                    'invoiced_subtotal_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_subtotal, $this->currency_code),
                    'base_subtotal' => Money::prepare_amount_from_minor($item->base_subtotal),
                    'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($item->base_subtotal),
                    'invoiced_discount_amount' => Money::prepare_amount_from_minor($item->invoiced_discount_amount, $this->currency_code),
                    'invoiced_discount_amount_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_discount_amount, $this->currency_code),
                    'base_discount_amount' => Money::prepare_amount_from_minor($item->base_discount_amount),
                    'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($item->base_discount_amount),
                    'invoiced_total' => Money::prepare_amount_from_minor($item->invoiced_total, $this->currency_code),
                    'invoiced_total_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_total, $this->currency_code),
                    'base_total' => Money::prepare_amount_from_minor($item->base_total),
                    'base_total_money_object' => Money::prepare_amount_object_from_minor($item->base_total),
                    'tax_rate' => $item->tax_rate,
                    'invoiced_tax_total' => Money::prepare_amount_from_minor($item->invoiced_tax_total, $this->currency_code),
                    'invoiced_tax_total_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_tax_total, $this->currency_code),
                    'base_tax_total' => Money::prepare_amount_from_minor($item->base_tax_total),
                    'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($item->base_tax_total),
                    'tax_breakdown' => $item->tax_breakdown,
                    'sku' => $item->sku,
                    'image' => MediaAttachment::make($item->product_image),
                ];
            }),

            'shipping_address' => [
                'first_name' => $this->shipping_first_name,
                'last_name' => $this->shipping_last_name,
                'address_line1' => $this->shipping_address_line1,
                'address_line2' => $this->shipping_address_line2,
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
                'address_line1' => $this->billing_address_line1,
                'address_line2' => $this->billing_address_line2,
                'city' => $this->billing_city,
                'state' => $this->billing_state,
                'country' => $this->billing_country,
                'postal_code' => $this->billing_postal_code,
                'phone' => $this->billing_phone,
                'email' => $this->billing_email,
            ],

            'payment_provider' => $this->payment_provider,
            'payment_provider_name' => $this->payment_metadata['payment_provider']['name'] ?? null,
            'payment_provider_icon' => $this->payment_metadata['payment_provider']['icon'] ?? null,
            'payment_provider_is_offline' => $this->payment_metadata['payment_provider']['is_offline'] ?? null,
            'payment_status' => $this->payment_status,
            'shipping_method' => $this->shipping_method,
            'shipping_method_name' => $this->shipping_metadata['shipping_method']['name'] ?? null,
            'shipping_method_type' => $this->shipping_metadata['shipping_method']['type'] ?? null,
            'customer_notes' => $this->customer_notes,

            'shipping_tracking' => [
                'carrier' => $this->shipping_carrier,
                'tracking_number' => $this->shipping_tracking_number,
                'tracking_url' => $this->shipping_tracking_url,
            ],

            'refunds' => empty($this->refunds) ? [] : $this->refunds->map(function ($refund) {
                return [
                    'id' => $refund->id,
                    'invoiced_amount' => Money::prepare_amount_from_minor($refund->invoiced_amount, $this->currency_code),
                    'invoiced_amount_money_object' => Money::prepare_amount_object_from_minor($refund->invoiced_amount, $this->currency_code),
                    'type' => $refund->refund_type,
                    'reason' => $refund->reason,
                    'transaction_id' => $refund->refund_id,
                    'status' => $refund->status,
                    'created_at' => $refund->created_at,
                    'created_by' => $refund->created_by,
                ];
            }),

            'archived_at' => $this->archived_at,
            'created_at' => $this->created_at,
        ];
    }
}
