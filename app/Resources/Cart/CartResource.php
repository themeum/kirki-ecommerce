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
     * @var bool
     */
    protected $should_calculate_tax;

    /**
     * @param object|array $resource
     * @param bool $should_calculate_tax
     */
    public function __construct($resource, bool $should_calculate_tax = true)
    {
        parent::__construct($resource);

        $this->should_calculate_tax = $should_calculate_tax;
    }

    /**
     * Convert the cart resource to an array.
     *
     * @return array The cart data as an associative array.
     */
    public function to_array()
    {
        if (!$this->resource) {
            return [];
        }

        $context = CalculationContextDTO::from_cart($this->resource);
        $context->should_calculate_tax = $this->should_calculate_tax;

        $recalculate_action = app()->make(RecalculateCartAction::class);
        $result = $recalculate_action->execute($context);

        $this->base_subtotal = $result->base_subtotal;
        $this->base_tax_total = $result->base_tax_total;
        $this->base_discount_total = $result->base_discount_total;
        $this->base_shipping_subtotal = $result->base_shipping_subtotal;
        $this->base_shipping_tax = $result->base_shipping_tax;
        $this->base_shipping_discount = $result->base_shipping_discount;
        $this->base_shipping_total = $result->base_shipping_total;
        $this->base_total = $result->base_total;
        $this->items_count = $result->items_count;

        $shipping_service = app()->make(ShippingService::class);
        $shipping_options = $shipping_service->get_final_available_shipping_options($context);

        $display_currency = Money::resolve_display_currency();

        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'cart_token' => $this->cart_token,

            'currency' => [
                'code' => $this->currency_code,
                'base_code' => $this->base_currency_code,
                'display_code' => $display_currency,
            ],

            'pricing' => [
                'base_subtotal' => Money::prepare_amount_from_minor($this->base_subtotal, $this->base_currency_code),
                'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($this->base_subtotal, $this->base_currency_code),
                'display_subtotal' => Money::prepare_amount_from_minor($this->base_subtotal, $this->base_currency_code, $display_currency),
                'display_subtotal_money_object' => Money::prepare_amount_object_from_minor($this->base_subtotal, $this->base_currency_code, $display_currency),

                'base_tax_total' => Money::prepare_amount_from_minor($this->base_tax_total, $this->base_currency_code),
                'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($this->base_tax_total, $this->base_currency_code),
                'display_tax_total' => Money::prepare_amount_from_minor($this->base_tax_total, $this->base_currency_code, $display_currency),
                'display_tax_total_money_object' => Money::prepare_amount_object_from_minor($this->base_tax_total, $this->base_currency_code, $display_currency),

                'discount_details' => $this->discount_details,
                'base_discount_total' => Money::prepare_amount_from_minor($this->base_discount_total, $this->base_currency_code),
                'base_discount_total_money_object' => Money::prepare_amount_object_from_minor($this->base_discount_total, $this->base_currency_code),
                'display_discount_total' => Money::prepare_amount_from_minor($this->base_discount_total, $this->base_currency_code, $display_currency),
                'display_discount_total_money_object' => Money::prepare_amount_object_from_minor($this->base_discount_total, $this->base_currency_code, $display_currency),

                'base_shipping_subtotal' => Money::prepare_amount_from_minor($this->base_shipping_subtotal, $this->base_currency_code),
                'base_shipping_subtotal_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_subtotal, $this->base_currency_code),
                'display_shipping_subtotal' => Money::prepare_amount_from_minor($this->base_shipping_subtotal, $this->base_currency_code, $display_currency),
                'display_shipping_subtotal_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_subtotal, $this->base_currency_code, $display_currency),

                'base_shipping_tax' => Money::prepare_amount_from_minor($this->base_shipping_tax, $this->base_currency_code),
                'base_shipping_tax_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_tax, $this->base_currency_code),
                'display_shipping_tax' => Money::prepare_amount_from_minor($this->base_shipping_tax, $this->base_currency_code, $display_currency),
                'display_shipping_tax_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_tax, $this->base_currency_code, $display_currency),

                'base_shipping_discount' => Money::prepare_amount_from_minor($this->base_shipping_discount, $this->base_currency_code),
                'base_shipping_discount_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_discount, $this->base_currency_code),
                'display_shipping_discount' => Money::prepare_amount_from_minor($this->base_shipping_discount, $this->base_currency_code, $display_currency),
                'display_shipping_discount_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_discount, $this->base_currency_code, $display_currency),

                'base_shipping_total' => Money::prepare_amount_from_minor($this->base_shipping_total, $this->base_currency_code),
                'base_shipping_total_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_total, $this->base_currency_code),
                'display_shipping_total' => Money::prepare_amount_from_minor($this->base_shipping_total, $this->base_currency_code, $display_currency),
                'display_shipping_total_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_total, $this->base_currency_code, $display_currency),

                'base_total' => Money::prepare_amount_from_minor($this->base_total, $this->base_currency_code),
                'base_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total, $this->base_currency_code),
                'display_total' => Money::prepare_amount_from_minor($this->base_total, $this->base_currency_code, $display_currency),
                'display_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total, $this->base_currency_code, $display_currency),
            ],

            'items_count' => $this->items_count,
            'items' => $this->prepare_items($this->items, $result, $display_currency),

            'shipping_address' => $this->shipping_address,
            'billing_address' => $this->billing_address,
            'is_billing_same_as_shipping' => $this->is_billing_same_as_shipping,

            'available_shipping_methods' => array_map(function ($method) use ($display_currency) {
                $cost = $method['base_cost'];
                $method['base_cost'] = Money::prepare_amount_from_minor($cost, $this->base_currency_code);
                $method['base_cost_money_object'] = Money::prepare_amount_object_from_minor($cost, $this->base_currency_code);
                $method['display_cost'] = Money::prepare_amount_from_minor($cost, $this->base_currency_code, $display_currency);
                $method['display_cost_money_object'] = Money::prepare_amount_object_from_minor($cost, $this->base_currency_code, $display_currency);
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

    protected function prepare_items($items, $result, $display_currency)
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
                        'base_price' => Money::prepare_amount_from_minor($item->variant->base_price, $this->base_currency_code),
                        'base_price_money_object' => Money::prepare_amount_object_from_minor($item->variant->base_price, $this->base_currency_code),
                        'display_price' => Money::prepare_amount_from_minor($item->variant->base_price, $this->base_currency_code, $display_currency),
                        'display_price_money_object' => Money::prepare_amount_object_from_minor($item->variant->base_price, $this->base_currency_code, $display_currency),
                        'base_sale_price' => !is_null($item->variant->base_sale_price) ? Money::prepare_amount_from_minor($item->variant->base_sale_price, $this->base_currency_code) : null,
                        'base_sale_price_money_object' => !is_null($item->variant->base_sale_price) ? Money::prepare_amount_object_from_minor($item->variant->base_sale_price, $this->base_currency_code) : null,
                        'display_sale_price' => !is_null($item->variant->base_sale_price) ? Money::prepare_amount_from_minor($item->variant->base_sale_price, $this->base_currency_code, $display_currency) : null,
                        'display_sale_price_money_object' => !is_null($item->variant->base_sale_price) ? Money::prepare_amount_object_from_minor($item->variant->base_sale_price, $this->base_currency_code, $display_currency) : null,
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
                    'base_product_total' => Money::prepare_amount_from_minor($calculated_item->base_product_total, $this->base_currency_code),
                    'base_product_total_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_product_total, $this->base_currency_code),
                    'display_product_total' => Money::prepare_amount_from_minor($calculated_item->base_product_total, $this->base_currency_code, $display_currency),
                    'display_product_total_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_product_total, $this->base_currency_code, $display_currency),
                    'base_subtotal' => Money::prepare_amount_from_minor($calculated_item->base_subtotal, $this->base_currency_code),
                    'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal, $this->base_currency_code),
                    'display_subtotal' => Money::prepare_amount_from_minor($calculated_item->base_subtotal, $this->base_currency_code, $display_currency),
                    'display_subtotal_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal, $this->base_currency_code, $display_currency),
                    'tax_rate' => $calculated_item->tax_rate,
                    'base_tax_amount' => Money::prepare_amount_from_minor($calculated_item->base_tax_amount, $this->base_currency_code),
                    'base_tax_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_tax_amount, $this->base_currency_code),
                    'display_tax_amount' => Money::prepare_amount_from_minor($calculated_item->base_tax_amount, $this->base_currency_code, $display_currency),
                    'display_tax_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_tax_amount, $this->base_currency_code, $display_currency),
                    'tax_breakdown' => $calculated_item->tax_breakdown,
                    'base_discount_amount' => Money::prepare_amount_from_minor($calculated_item->base_discount_amount, $this->base_currency_code),
                    'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_discount_amount, $this->base_currency_code),
                    'display_discount_amount' => Money::prepare_amount_from_minor($calculated_item->base_discount_amount, $this->base_currency_code, $display_currency),
                    'display_discount_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_discount_amount, $this->base_currency_code, $display_currency),
                    'base_total' => Money::prepare_amount_from_minor($calculated_item->base_total, $this->base_currency_code),
                    'base_total_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_total, $this->base_currency_code),
                    'display_total' => Money::prepare_amount_from_minor($calculated_item->base_total, $this->base_currency_code, $display_currency),
                    'display_total_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_total, $this->base_currency_code, $display_currency),
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ];
            }
        }

        return $cart_items;
    }
}
