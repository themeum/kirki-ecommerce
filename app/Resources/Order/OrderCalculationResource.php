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
                'subtotal' => Money::prepare_amount($result->subtotal, $result->currency_code, $this->currency_code),
                'subtotal_money_object' => Money::prepare_amount_object($result->subtotal, $result->currency_code, $this->currency_code),
                'tax_total' => Money::prepare_amount($result->tax_total, $result->currency_code, $this->currency_code),
                'tax_total_money_object' => Money::prepare_amount_object($result->tax_total, $result->currency_code, $this->currency_code),
                'discount_details' => $result->discount_details,
                'discount_total' => Money::prepare_amount($result->discount_total, $result->currency_code, $this->currency_code),
                'discount_total_money_object' => Money::prepare_amount_object($result->discount_total, $result->currency_code, $this->currency_code),
                'shipping_subtotal' => Money::prepare_amount($result->shipping_subtotal, $result->currency_code, $this->currency_code),
                'shipping_subtotal_money_object' => Money::prepare_amount_object($result->shipping_subtotal, $result->currency_code, $this->currency_code),
                'shipping_tax' => Money::prepare_amount($result->shipping_tax, $result->currency_code, $this->currency_code),
                'shipping_tax_money_object' => Money::prepare_amount_object($result->shipping_tax, $result->currency_code, $this->currency_code),
                'shipping_discount' => Money::prepare_amount($result->shipping_discount, $result->currency_code, $this->currency_code),
                'shipping_discount_money_object' => Money::prepare_amount_object($result->shipping_discount, $result->currency_code, $this->currency_code),
                'shipping_total' => Money::prepare_amount($result->shipping_total, $result->currency_code, $this->currency_code),
                'shipping_total_money_object' => Money::prepare_amount_object($result->shipping_total, $result->currency_code, $this->currency_code),
                'total' => Money::prepare_amount($result->total, $result->currency_code, $this->currency_code),
                'total_money_object' => Money::prepare_amount_object($result->total, $result->currency_code, $this->currency_code),
            ],

            'items_count' => $result->items_count,
            'items' => $this->prepare_items($result->items, $result),

            'available_shipping_methods' => array_map(function ($method) use ($result) {
                $cost = $method['cost'];
                $method['cost'] = Money::prepare_amount($cost, $result->currency_code, $this->currency_code);
                $method['cost_money_object'] = Money::prepare_amount_object($cost, $result->currency_code, $this->currency_code);
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

                $tax_breakdowns = [];

                foreach ($calculated_item->tax_breakdown as $tax_breakdown_item) {
                    $tax_breakdowns[] = [
                        'name' => $tax_breakdown_item->name,
                        'rate' => $tax_breakdown_item->rate,
                        'amount' => Money::prepare_amount($tax_breakdown_item->amount, $result->currency_code, $this->currency_code),
                        'amount_money_object' => Money::prepare_amount_object($tax_breakdown_item->amount, $result->currency_code, $this->currency_code),
                    ];
                }

                $cart_items[] = [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'subtotal' => Money::prepare_amount($calculated_item->subtotal, $result->currency_code, $this->currency_code),
                    'subtotal_money_object' => Money::prepare_amount_object($calculated_item->subtotal, $result->currency_code, $this->currency_code),
                    'tax_rate' => $calculated_item->tax_rate,
                    'tax_amount' => Money::prepare_amount($calculated_item->tax_amount, $result->currency_code, $this->currency_code),
                    'tax_amount_money_object' => Money::prepare_amount_object($calculated_item->tax_amount, $result->currency_code, $this->currency_code),
                    'tax_breakdown' => $tax_breakdowns,
                    'discount_amount' => Money::prepare_amount($calculated_item->discount_amount, $result->currency_code, $this->currency_code),
                    'discount_amount_money_object' => Money::prepare_amount_object($calculated_item->discount_amount, $result->currency_code, $this->currency_code),
                    'total' => Money::prepare_amount($calculated_item->total, $result->currency_code, $this->currency_code),
                    'total_money_object' => Money::prepare_amount_object($calculated_item->total, $result->currency_code, $this->currency_code),
                ];
            }
        }

        return $cart_items;
    }
}