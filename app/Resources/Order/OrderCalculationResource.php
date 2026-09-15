<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
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

                'coupons' => $this->format_coupon_results($result->coupon_results, $result->currency_code, $display_currency),
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

                'display_total_after_discount_money_object' => Money::prepare_amount_object_from_minor(
                    $result->base_subtotal - ($result->base_discount_total - $result->base_shipping_discount),
                    $result->currency_code,
                    $display_currency
                ),
                'tax_lines' => $this->format_tax_breakdown($this->flatten_item_tax_lines($result), $result->currency_code, $display_currency),
                'shipping_tax_lines' => $this->format_tax_breakdown($result->shipping_tax_lines, $result->currency_code, $display_currency),
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
                $product_coupon_discount = $this->get_product_coupon_discount_for_item($result->coupon_results, $item->variant_id);

                $tax_lines = [];

                foreach ($calculated_item->tax_lines as $tax_line) {
                    $tax_lines[] = [
                        'name' => $tax_line->name,
                        'rate' => $tax_line->rate,
                        'base_amount' => Money::prepare_amount_from_minor($tax_line->base_amount, $result->currency_code),
                        'base_amount_money_object' => Money::prepare_amount_object_from_minor($tax_line->base_amount, $result->currency_code),
                        'display_amount' => Money::prepare_amount_from_minor($tax_line->base_amount, $result->currency_code, $display_currency),
                        'display_amount_money_object' => Money::prepare_amount_object_from_minor($tax_line->base_amount, $result->currency_code, $display_currency),
                    ];
                }

                $cart_items[] = [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'base_subtotal' => Money::prepare_amount_from_minor($calculated_item->base_subtotal, $result->currency_code),
                    'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal, $result->currency_code),
                    'display_subtotal' => Money::prepare_amount_from_minor($calculated_item->base_subtotal, $result->currency_code, $display_currency),
                    'display_subtotal_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal, $result->currency_code, $display_currency),
                    'base_tax_amount' => Money::prepare_amount_from_minor($calculated_item->base_tax_amount, $result->currency_code),
                    'base_tax_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_tax_amount, $result->currency_code),
                    'display_tax_amount' => Money::prepare_amount_from_minor($calculated_item->base_tax_amount, $result->currency_code, $display_currency),
                    'display_tax_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_tax_amount, $result->currency_code, $display_currency),
                    'tax_lines' => $tax_lines,
                    'base_discount_amount' => Money::prepare_amount_from_minor($calculated_item->base_discount_amount, $result->currency_code),
                    'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_discount_amount, $result->currency_code),
                    'display_discount_amount' => Money::prepare_amount_from_minor($calculated_item->base_discount_amount, $result->currency_code, $display_currency),
                    'display_discount_amount_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_discount_amount, $result->currency_code, $display_currency),
                    'base_total' => Money::prepare_amount_from_minor($calculated_item->base_total, $result->currency_code),
                    'base_total_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_total, $result->currency_code),
                    'display_total' => Money::prepare_amount_from_minor($calculated_item->base_total, $result->currency_code, $display_currency),
                    'display_total_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_total, $result->currency_code, $display_currency),
                    'display_line_price_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal - $product_coupon_discount, $result->currency_code, $display_currency),
                    'display_strikethrough_price_money_object' => $this->prepare_strikethrough_price($calculated_item, $product_coupon_discount, $result->currency_code, $display_currency),
                    'applied_product_coupons' => $this->get_applied_product_coupons_for_item($result->coupon_results, $item->variant_id, $result->currency_code, $display_currency),
                ];
            }
        }

        return $cart_items;
    }

    protected function format_coupon_results(array $coupon_results, $base_currency_code, $display_currency)
    {
        return array_map(function ($coupon_result) use ($base_currency_code, $display_currency) {
            $coupon = $coupon_result->coupon;

            return [
                'code' => $coupon->code,
                'title' => $coupon->title,
                'discount_type' => $coupon->discount_type,
                'discount_target' => $coupon->discount_target,
                'discount_value_type' => $coupon->discount_value_type,
                'discount_amount_percentage' => $coupon->discount_amount_percentage,
                'base_discount_amount_fixed' => $coupon->base_discount_amount_fixed,
                'base_discount_amount' => Money::prepare_amount_from_minor($coupon_result->total_discount, $base_currency_code),
                'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($coupon_result->total_discount, $base_currency_code),
                'display_discount_amount' => Money::prepare_amount_from_minor($coupon_result->total_discount, $base_currency_code, $display_currency),
                'display_discount_amount_money_object' => Money::prepare_amount_object_from_minor($coupon_result->total_discount, $base_currency_code, $display_currency),
            ];
        }, $coupon_results);
    }

    /**
     * Sum how much of an item's discount came from item-scoped ("product")
     * coupons only - cart-wide ("order") coupons are excluded so a line
     * item's display price never reflects an order-wide discount.
     *
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results
     * @param int $variant_id
     * @return int
     */
    protected function get_product_coupon_discount_for_item(array $coupon_results, $variant_id)
    {
        $discount = 0;

        foreach ($coupon_results as $coupon_result) {
            if ($coupon_result->coupon->discount_target !== DiscountTarget::PRODUCTS) {
                continue;
            }

            $discount += $coupon_result->item_discounts[$variant_id] ?? 0;
        }

        return $discount;
    }

    /**
     * List the item-scoped coupons that actually discounted this item, for
     * per-item coupon badges. Cart-wide coupons never appear here.
     *
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results
     * @param int $variant_id
     * @param string $base_currency_code
     * @param string $display_currency
     * @return array
     */
    protected function get_applied_product_coupons_for_item(array $coupon_results, $variant_id, $base_currency_code, $display_currency)
    {
        $applied = [];

        foreach ($coupon_results as $coupon_result) {
            if ($coupon_result->coupon->discount_target !== DiscountTarget::PRODUCTS) {
                continue;
            }

            $discount_amount = $coupon_result->item_discounts[$variant_id] ?? 0;

            if ($discount_amount <= 0) {
                continue;
            }

            $coupon = $coupon_result->coupon;

            $applied[] = [
                'code' => $coupon->code,
                'title' => $coupon->title,
                'discount_value_type' => $coupon->discount_value_type,
                'discount_amount_percentage' => $coupon->discount_amount_percentage,
                'base_discount_amount_fixed' => $coupon->base_discount_amount_fixed,
                'display_discount_amount_money_object' => Money::prepare_amount_object_from_minor($discount_amount, $base_currency_code, $display_currency),
            ];
        }

        return $applied;
    }

    /**
     * Aggregate a flat list of TaxLineDTO entries (e.g. every item's
     * tax_lines merged together) into one amount per tax name. Entries
     * with a zero amount are dropped so a checkout summary never renders a
     * "Tax: $0.00" line when nothing was actually charged.
     *
     * @param \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[] $tax_lines
     * @param string $base_currency_code
     * @param string $display_currency
     * @return array
     */
    protected function format_tax_breakdown(array $tax_lines, $base_currency_code, $display_currency)
    {
        $totals_by_key = [];

        foreach ($tax_lines as $tax_line) {
            if (empty($tax_line->base_amount)) {
                continue;
            }

            $key = $tax_line->name . '|' . $tax_line->rate;

            if (!isset($totals_by_key[$key])) {
                $totals_by_key[$key] = ['name' => $tax_line->name, 'rate' => $tax_line->rate, 'amount' => 0];
            }

            $totals_by_key[$key]['amount'] += $tax_line->base_amount;
        }

        $breakdown = [];

        foreach ($totals_by_key as $entry) {
            $breakdown[] = [
                'name' => $entry['name'],
                'rate' => $entry['rate'],
                'display_amount_money_object' => Money::prepare_amount_object_from_minor($entry['amount'], $base_currency_code, $display_currency),
            ];
        }

        return $breakdown;
    }

    /**
     * The line item's "was" price before its current display price - the
     * sale-adjusted subtotal if a product coupon further discounted it,
     * otherwise the regular price if only a sale is active. Null when
     * neither applies, so nothing should render as struck through.
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO $calculated_item
     * @param int $product_coupon_discount
     * @param string $base_currency_code
     * @param string $display_currency
     * @return \Kirki\Ecommerce\App\DTO\MoneyDTO|null
     */
    protected function prepare_strikethrough_price($calculated_item, $product_coupon_discount, $base_currency_code, $display_currency)
    {
        if ($product_coupon_discount > 0) {
            $strikethrough_amount = $calculated_item->base_subtotal;
        } elseif ($calculated_item->base_subtotal < $calculated_item->base_product_total) {
            $strikethrough_amount = $calculated_item->base_product_total;
        } else {
            return null;
        }

        return Money::prepare_amount_object_from_minor($strikethrough_amount, $base_currency_code, $display_currency);
    }

    /**
     * Merge every calculated item's tax lines into one flat list for
     * cart-wide aggregation by tax name.
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO $result
     * @return \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[]
     */
    protected function flatten_item_tax_lines($result)
    {
        $tax_lines = [];

        foreach ($result->items as $calculated_item) {
            foreach ($calculated_item->tax_lines as $tax_line) {
                $tax_lines[] = $tax_line;
            }
        }

        return $tax_lines;
    }
}
