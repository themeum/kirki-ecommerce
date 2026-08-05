<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\Framework\app;

class OrderCalculationResource extends Resource
{
    /**
     * Convert the cart resource to an array.
     *
     * @return array The cart data as an associative array.
     */
    public function to_array()
    {
        $result = $this->result;
        $context = $this->context;

        $shipping_service = app()->make(ShippingService::class);
        $shipping_options = $shipping_service->get_final_available_shipping_options($context);

        return [
            'pricing' => [
                'subtotal' => $this->prepare_amount($result->subtotal),
                'tax_total' => $this->prepare_amount($result->tax_total),
                'discount_details' => $result->discount_details,
                'discount_total' => $this->prepare_amount($result->discount_total),
                'shipping_subtotal' => $this->prepare_amount($result->shipping_subtotal),
                'shipping_tax' => $this->prepare_amount($result->shipping_tax),
                'shipping_discount' => $this->prepare_amount($result->shipping_discount),
                'shipping_total' => $this->prepare_amount($result->shipping_total),
                'total' => $this->prepare_amount($result->total),
            ],

            'items_count' => $result->items_count,
            'items' => $this->prepare_items($result->items, $result),

            'available_shipping_methods' => array_map(function ($method) {
                $method['cost'] = $this->prepare_amount($method['cost']);
                return $method;
            }, $shipping_options),

            'shipping_method' => $result->shipping_method
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
                    'quantity' => $item->quantity,
                    'subtotal' => $this->prepare_amount($calculated_item->subtotal),
                    'tax_rate' => $calculated_item->tax_rate,
                    'tax_amount' => $this->prepare_amount($calculated_item->tax_amount),
                    'tax_breakdown' => $calculated_item->tax_breakdown,
                    'discount_amount' => $this->prepare_amount($calculated_item->discount_amount),
                    'total' => $this->prepare_amount($calculated_item->total)
                ];
            }
        }

        return $cart_items;
    }

    protected function prepare_amount($amount)
    {
        $value = Money::convert_to_currency(Money::from_minor($amount), $this->currency_code)->getMinorAmount();
        
        return Money::to_dto($value, $this->currency_code);
    }
}
