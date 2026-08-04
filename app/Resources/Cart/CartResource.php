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
                'subtotal' => $this->prepare_amount($this->subtotal),
                'subtotal_formatted' => Money::format_from_decimal($this->prepare_amount($this->subtotal)),
                'tax_total' => $this->prepare_amount($this->tax_total),
                'discount_details' => $this->discount_details,
                'discount_total' => $this->prepare_amount($this->discount_total),
                'shipping_subtotal' => $this->prepare_amount($this->shipping_subtotal),
                'shipping_tax' => $this->prepare_amount($this->shipping_tax),
                'shipping_discount' => $this->prepare_amount($this->shipping_discount),
                'shipping_total' => $this->prepare_amount($this->shipping_total),
                'total' => $this->prepare_amount($this->total),
                'total_formatted' =>  Money::format_from_decimal($this->prepare_amount($this->total)),
            ],

            'items_count' => $this->items_count,
            'items' => $this->prepare_items($this->items, $result),

            'shipping_address' => $this->shipping_address,
            'billing_address' => $this->billing_address,

            'available_shipping_methods' => array_map(function ($method) {
                $method['cost'] = $this->prepare_amount($method['cost']);
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
                        'price' => $this->prepare_amount($item->variant->price),
                        'sale_price' => $this->prepare_amount($item->variant->sale_price ?? 0),
                        'media' => !empty($item->variant->media) ? MediaAttachment::make($item->variant->media) : MediaAttachment::make($item->product->media->first() ?? null) ?? null,
                        'categories' => $item->product->categories->map(function ($category) {
                            return [
                                'id' => $category->id,
                                'name' => $category->name,
                                'parent_id' => $category->parent_id,
                                'level' => $category->level,
                            ];
                        })->to_array(),
                        'attributes' => $item->variant->attribute_values->map(function ($value) {
                            return $value->value;
                        })->to_array(),
                        'available_quantity' => $item->variant->available_quantity,
                    ],
                    'subtotal' => $this->prepare_amount($calculated_item->subtotal),
                    'tax_rate' => $calculated_item->tax_rate,
                    'tax_amount' => $this->prepare_amount($calculated_item->tax_amount),
                    'tax_breakdown' => $calculated_item->tax_breakdown,
                    'discount_amount' => $this->prepare_amount($calculated_item->discount_amount),
                    'total' => $this->prepare_amount($calculated_item->total),
                    'total_formatted' => Money::format_from_decimal($this->prepare_amount($calculated_item->total)),
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ];
            }
        }

        return $cart_items;
    }

    protected function prepare_amount($amount)
    {
        return Money::convert_to_currency(Money::from_minor($amount, $this->base_currency_code), $this->currency_code)->getAmount();
    }
}
