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

        $display_currency = $this->currency_code ?? Money::resolve_display_currency();

        return [
            'pricing' => [
                'base_subtotal' => Money::prepare_amount_from_minor($result->base_subtotal, $result->currency_code),
                'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($result->base_subtotal, $result->currency_code),
                'display_subtotal' => Money::prepare_amount_from_minor($result->base_subtotal, $result->currency_code, $display_currency),
                'display_subtotal_money_object' => Money::prepare_amount_object_from_minor($result->base_subtotal, $result->currency_code, $display_currency),

                'base_tax_total' => Money::prepare_amount_from_minor($result->base_tax_total, $result->currency_code),
                'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($result->base_tax_total, $result->currency_code),
                'display_tax_total' => Money::prepare_amount_from_minor($result->base_tax_total, $result->currency_code, $display_currency),
                'display_tax_total_money_object' => Money::prepare_amount_object_from_minor($result->base_tax_total, $result->currency_code, $display_currency),

                'discount_details' => $result->discount_details,
                'base_discount_total' => Money::prepare_amount_from_minor($result->base_discount_total, $result->currency_code),
                'base_discount_total_money_object' => Money::prepare_amount_object_from_minor($result->base_discount_total, $result->currency_code),
                'display_discount_total' => Money::prepare_amount_from_minor($result->base_discount_total, $result->currency_code, $display_currency),
                'display_discount_total_money_object' => Money::prepare_amount_object_from_minor($result->base_discount_total, $result->currency_code, $display_currency),

                'base_shipping_subtotal' => Money::prepare_amount_from_minor($result->base_shipping_subtotal, $result->currency_code),
                'base_shipping_subtotal_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_subtotal, $result->currency_code),
                'display_shipping_subtotal' => Money::prepare_amount_from_minor($result->base_shipping_subtotal, $result->currency_code, $display_currency),
                'display_shipping_subtotal_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_subtotal, $result->currency_code, $display_currency),

                'base_shipping_tax' => Money::prepare_amount_from_minor($result->base_shipping_tax, $result->currency_code),
                'base_shipping_tax_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_tax, $result->currency_code),
                'display_shipping_tax' => Money::prepare_amount_from_minor($result->base_shipping_tax, $result->currency_code, $display_currency),
                'display_shipping_tax_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_tax, $result->currency_code, $display_currency),

                'base_shipping_discount' => Money::prepare_amount_from_minor($result->base_shipping_discount, $result->currency_code),
                'base_shipping_discount_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_discount, $result->currency_code),
                'display_shipping_discount' => Money::prepare_amount_from_minor($result->base_shipping_discount, $result->currency_code, $display_currency),
                'display_shipping_discount_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_discount, $result->currency_code, $display_currency),

                'base_shipping_total' => Money::prepare_amount_from_minor($result->base_shipping_total, $result->currency_code),
                'base_shipping_total_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_total, $result->currency_code),
                'display_shipping_total' => Money::prepare_amount_from_minor($result->base_shipping_total, $result->currency_code, $display_currency),
                'display_shipping_total_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_total, $result->currency_code, $display_currency),

                'base_total' => Money::prepare_amount_from_minor($result->base_total, $result->currency_code),
                'base_total_money_object' => Money::prepare_amount_object_from_minor($result->base_total, $result->currency_code),
                'display_total' => Money::prepare_amount_from_minor($result->base_total, $result->currency_code, $display_currency),
                'display_total_money_object' => Money::prepare_amount_object_from_minor($result->base_total, $result->currency_code, $display_currency),
            ],

            'items_count' => $result->items_count,
            'items' => $this->prepare_items($result->items, $result, $display_currency),

            'available_shipping_methods' => array_map(function ($method) use ($result, $display_currency) {
                $cost = $method['base_cost'];
                $method['base_cost'] = Money::prepare_amount_from_minor($cost, $result->currency_code);
                $method['base_cost_money_object'] = Money::prepare_amount_object_from_minor($cost, $result->currency_code);
                $method['display_cost'] = Money::prepare_amount_from_minor($cost, $result->currency_code, $display_currency);
                $method['display_cost_money_object'] = Money::prepare_amount_object_from_minor($cost, $result->currency_code, $display_currency);
                return $method;
            }, $shipping_options),

            'shipping_method' => $result->shipping_method
        ];
    }

    protected function prepare_items($items, $result, $display_currency)
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
                        'base_amount' => Money::prepare_amount_from_minor($tax_breakdown_item->base_amount, $result->currency_code),
                        'base_amount_money_object' => Money::prepare_amount_object_from_minor($tax_breakdown_item->base_amount, $result->currency_code),
                        'display_amount' => Money::prepare_amount_from_minor($tax_breakdown_item->base_amount, $result->currency_code, $display_currency),
                        'display_amount_money_object' => Money::prepare_amount_object_from_minor($tax_breakdown_item->base_amount, $result->currency_code, $display_currency),
                    ];
                }

                $cart_items[] = [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'base_subtotal' => Money::prepare_amount_from_minor($calculated_item->base_subtotal, $result->currency_code),
                    'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal, $result->currency_code),
                    'display_subtotal' => Money::prepare_amount_from_minor($calculated_item->base_subtotal, $result->currency_code, $display_currency),
                    'display_subtotal_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal, $result->currency_code, $display_currency),
                    'tax_rate' => $calculated_item->tax_rate,
                    'base_tax_amount' => Money::prepare_amount_from_minor($calculated_item->base_tax_amount, $result->currency_code),
                    'base_tax_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_tax_amount, $result->currency_code),
                    'display_tax_amount' => Money::prepare_amount_from_minor($calculated_item->base_tax_amount, $result->currency_code, $display_currency),
                    'display_tax_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_tax_amount, $result->currency_code, $display_currency),
                    'tax_breakdown' => $tax_breakdowns,
                    'base_discount_amount' => Money::prepare_amount_from_minor($calculated_item->base_discount_amount, $result->currency_code),
                    'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_discount_amount, $result->currency_code),
                    'display_discount_amount' => Money::prepare_amount_from_minor($calculated_item->base_discount_amount, $result->currency_code, $display_currency),
                    'display_discount_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_discount_amount, $result->currency_code, $display_currency),
                    'base_total' => Money::prepare_amount_from_minor($calculated_item->base_total, $result->currency_code),
                    'base_total_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_total, $result->currency_code),
                    'display_total' => Money::prepare_amount_from_minor($calculated_item->base_total, $result->currency_code, $display_currency),
                    'display_total_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_total, $result->currency_code, $display_currency),
                ];
            }
        }

        return $cart_items;
    }
}
