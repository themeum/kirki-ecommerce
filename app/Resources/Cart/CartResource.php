<?php

namespace Kirki\Ecommerce\App\Resources\Cart;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\Framework\app;

class CartResource extends Resource
{
    /**
     * Convert the cart resource to an array.
     *
     * @return array The cart data as an associative array.
     */
    public function to_array()
    {
        $context = CalculationContextDTO::from_cart($this->resource);
        $recalculate_action = app()->make(RecalculateCartAction::class);
        $result = $recalculate_action->execute($context);

        $this->subtotal = $result->subtotal;
        $this->tax_total = $result->tax_total;
        $this->discount_total = $result->discount_total;
        $this->shipping_subtotal = $result->shipping_subtotal;
        $this->shipping_tax = $result->shipping_tax;
        $this->shipping_discount = $result->shipping_discount;
        $this->shipping_total = $result->shipping_total;
        $this->total = $result->total;
        $this->items_count = $result->items_count;

        $shipping_service = app()->make(ShippingService::class);
        $shipping_options = $shipping_service->get_final_available_shipping_options($context);

        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'cart_token' => $this->cart_token,

            'currency' => [
                'code' => $this->currency_code,
                'base_code' => $this->base_currency_code,
            ],

            'pricing' => [
                'subtotal' => Money::prepare_amount($this->subtotal, $this->base_currency_code, $this->currency_code),
                'subtotal_money_object' => Money::prepare_amount_object($this->subtotal, $this->base_currency_code, $this->currency_code),
                'tax_total' => Money::prepare_amount($this->tax_total, $this->base_currency_code, $this->currency_code),
                'tax_total_money_object' => Money::prepare_amount_object($this->tax_total, $this->base_currency_code, $this->currency_code),
                'discount_details' => $this->discount_details,
                'discount_total' => Money::prepare_amount($this->discount_total, $this->base_currency_code, $this->currency_code),
                'discount_total_money_object' => Money::prepare_amount_object($this->discount_total, $this->base_currency_code, $this->currency_code),
                'shipping_subtotal' => Money::prepare_amount($this->shipping_subtotal, $this->base_currency_code, $this->currency_code),
                'shipping_subtotal_money_object' => Money::prepare_amount_object($this->shipping_subtotal, $this->base_currency_code, $this->currency_code),
                'shipping_tax' => Money::prepare_amount($this->shipping_tax, $this->base_currency_code, $this->currency_code),
                'shipping_tax_money_object' => Money::prepare_amount_object($this->shipping_tax, $this->base_currency_code, $this->currency_code),
                'shipping_discount' => Money::prepare_amount($this->shipping_discount, $this->base_currency_code, $this->currency_code),
                'shipping_discount_money_object' => Money::prepare_amount_object($this->shipping_discount, $this->base_currency_code, $this->currency_code),
                'shipping_total' => Money::prepare_amount($this->shipping_total, $this->base_currency_code, $this->currency_code),
                'shipping_total_money_object' => Money::prepare_amount_object($this->shipping_total, $this->base_currency_code, $this->currency_code),
                'total' => Money::prepare_amount($this->total, $this->base_currency_code, $this->currency_code),
                'total_money_object' => Money::prepare_amount_object($this->total, $this->base_currency_code, $this->currency_code),
            ],

            'items_count' => $this->items_count,
            'items' => $this->prepare_items($this->items, $result),

            'shipping_address' => $this->shipping_address,
            'billing_address' => $this->billing_address,
            'is_billing_same_as_shipping' => $this->is_billing_same_as_shipping,

            'available_shipping_methods' => array_map(function ($method) {
                $cost = $method['cost'];
                $method['cost'] = Money::prepare_amount($cost, $this->base_currency_code, $this->currency_code);
                $method['cost_money_object'] = Money::prepare_amount_object($cost, $this->base_currency_code, $this->currency_code);
                return $method;
            }, $shipping_options),
            'shipping_method' => $this->shipping_method,

            'customer_notes' => $this->customer_notes,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,

            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function prepare_items($items, $result)
    {
        $cart_items = [];

        foreach ($items as $item) {
            if (isset($result->items[$item->variant_id])) {
                $calculated_item = $result->items[$item->variant_id];

                $cart_items[] = [
                    'id' => $item->id,
                    'cart_id' => $item->cart_id,
                    'quantity' => $item->quantity,
                    'product' => [
                        'id' => $item->product->id,
                        'variant_id' => $item->variant->id,
                        'title' => $item->product->title,
                        'slug' => $item->product->slug,
                        'price' => Money::prepare_amount($item->variant->price, $this->base_currency_code, $this->currency_code),
                        'price_money_object' => Money::prepare_amount_object($item->variant->price, $this->base_currency_code, $this->currency_code),
                        'sale_price' => !is_null($item->variant->sale_price) ? Money::prepare_amount($item->variant->sale_price, $this->base_currency_code, $this->currency_code) : null,
                        'sale_price_money_object' => !is_null($item->variant->sale_price) ? Money::prepare_amount_object($item->variant->sale_price, $this->base_currency_code, $this->currency_code) : null,
                        'media' => !empty($item->variant->media) ? MediaAttachment::make($item->variant->media) : MediaAttachment::make($item->product->media->first() ?? null) ?? null,
                    ],
                    'subtotal' => Money::prepare_amount($calculated_item->subtotal, $this->base_currency_code, $this->currency_code),
                    'subtotal_money_object' => Money::prepare_amount_object($calculated_item->subtotal, $this->base_currency_code, $this->currency_code),
                    'tax_rate' => $calculated_item->tax_rate,
                    'tax_amount' => Money::prepare_amount($calculated_item->tax_amount, $this->base_currency_code, $this->currency_code),
                    'tax_amount_money_object' => Money::prepare_amount_object($calculated_item->tax_amount, $this->base_currency_code, $this->currency_code),
                    'tax_breakdown' => $calculated_item->tax_breakdown,
                    'discount_amount' => Money::prepare_amount($calculated_item->discount_amount, $this->base_currency_code, $this->currency_code),
                    'discount_amount_money_object' => Money::prepare_amount_object($calculated_item->discount_amount, $this->base_currency_code, $this->currency_code),
                    'total' => Money::prepare_amount($calculated_item->total, $this->base_currency_code, $this->currency_code),
                    'total_money_object' => Money::prepare_amount_object($calculated_item->total, $this->base_currency_code, $this->currency_code),
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ];
            }
        }

        return $cart_items;
    }
}
