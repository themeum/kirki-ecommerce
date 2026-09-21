<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

/**
 * API resource for a full order (admin), with totals, items, coupons, addresses and refunds.
 *
 * @since 1.0.0
 */
class OrderResource extends Resource
{
    /**
     * Convert the order resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The order data, with amounts in the invoiced currency and the base currency.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'order_number' => $this->order_number,
            'invoice_number' => $this->invoice_number,

            'customer_id' => $this->customer_id,
            'customer' => [
                'first_name' => $this->customer_first_name,
                'last_name' => $this->customer_last_name,
                'email' => $this->customer_email,
                'phone' => $this->customer_phone,
            ],

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
                'invoiced_tax' => Money::prepare_amount_from_minor($this->invoiced_tax_total, $this->currency_code),
                'invoiced_tax_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_tax_total, $this->currency_code),
                'base_tax' => Money::prepare_amount_from_minor($this->base_tax_total),
                'base_tax_money_object' => Money::prepare_amount_object_from_minor($this->base_tax_total),
                'invoiced_shipping_tax' => Money::prepare_amount_from_minor($this->invoiced_shipping_tax_amount, $this->currency_code),
                'invoiced_shipping_tax_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_shipping_tax_amount, $this->currency_code),
                'base_shipping_tax' => Money::prepare_amount_from_minor($this->base_shipping_tax_amount),
                'base_shipping_tax_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_tax_amount),
                'invoiced_total' => Money::prepare_amount_from_minor($this->invoiced_total, $this->currency_code),
                'invoiced_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_total, $this->currency_code),
                'base_total' => Money::prepare_amount_from_minor($this->base_total),
                'base_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total),
            ],

            'coupons' => empty($this->order_coupons) ? [] : $this->order_coupons->map(function ($order_coupon) {
                return [
                    'id' => $order_coupon->id,
                    'coupon_id' => $order_coupon->coupon_id,
                    'code' => $order_coupon->code,
                    'title' => $order_coupon->title,
                    'discount_type' => $order_coupon->discount_type,
                    'discount_target' => $order_coupon->discount_target,
                    'invoiced_discount_amount' => Money::prepare_amount_from_minor($order_coupon->invoiced_discount_amount, $this->currency_code),
                    'invoiced_discount_amount_money_object' => Money::prepare_amount_object_from_minor($order_coupon->invoiced_discount_amount, $this->currency_code),
                    'base_discount_amount' => Money::prepare_amount_from_minor($order_coupon->base_discount_amount),
                    'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($order_coupon->base_discount_amount),
                    'usage_reversed_at' => $order_coupon->usage_reversed_at,
                    'item_attributions' => empty($order_coupon->order_item_coupons) ? [] : $order_coupon->order_item_coupons->map(function ($attribution) {
                        return [
                            'order_item_id' => $attribution->order_item_id,
                            'invoiced_discount_amount' => Money::prepare_amount_from_minor($attribution->invoiced_discount_amount, $this->currency_code),
                            'invoiced_discount_amount_money_object' => Money::prepare_amount_object_from_minor($attribution->invoiced_discount_amount, $this->currency_code),
                            'base_discount_amount' => Money::prepare_amount_from_minor($attribution->base_discount_amount),
                            'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($attribution->base_discount_amount),
                        ];
                    }),
                ];
            }),

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
                    'invoiced_tax_total' => Money::prepare_amount_from_minor($item->invoiced_tax_total, $this->currency_code),
                    'invoiced_tax_total_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_tax_total, $this->currency_code),
                    'base_tax_total' => Money::prepare_amount_from_minor($item->base_tax_total),
                    'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($item->base_tax_total),
                    'tax_lines' => $this->format_order_taxes($item->taxes, $this->currency_code),
                    'sku' => $item->sku,
                    'image' => MediaAttachment::make($item->product_image),
                ];
            }),

            'shipping_tax_lines' => $this->format_order_taxes($this->shipping_taxes, $this->currency_code),

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
            'admin_notes' => $this->admin_notes,
            'flags' => $this->flags,

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

    /**
     * Format a set of persisted order_taxes rows (an item's, or the order's
     * shipping) into API tax lines.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderTax[] $taxes         Persisted order tax rows.
     * @param string                                 $currency_code Currency code the order was invoiced in.
     * @return array|\Kirki\Ecommerce\Framework\Collections\Collection Empty array when there are no taxes, otherwise a collection of tax lines.
     */
    protected function format_order_taxes($taxes, $currency_code)
    {
        if (empty($taxes)) {
            return [];
        }

        return $taxes->map(function ($tax) use ($currency_code) {
            return [
                'name' => $tax->name,
                'rate' => $tax->rate,
                'invoiced_amount' => Money::prepare_amount_from_minor($tax->invoiced_amount, $currency_code),
                'invoiced_amount_money_object' => Money::prepare_amount_object_from_minor($tax->invoiced_amount, $currency_code),
                'base_amount' => Money::prepare_amount_from_minor($tax->base_amount),
                'base_amount_money_object' => Money::prepare_amount_object_from_minor($tax->base_amount),
            ];
        });
    }
}
