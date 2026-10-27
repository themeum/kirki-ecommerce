<?php

namespace Kirki\Ecommerce\App\Resources\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Concerns\ResolvesLineItemPricing;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\Framework\app;

/**
 * API resource for the priced result of an order or cart calculation.
 *
 * @since 1.0.0
 */
class OrderCalculationResource extends Resource
{
    use ResolvesLineItemPricing;

    /**
     * Convert the calculation result to an array.
     *
     * Wraps the calculation result and context together, and adds the shipping options
     * available for that context. Every monetary figure is a base-currency money object -
     * this payload is used only in the admin order create/recalculate screen, which prices
     * in the store's base currency. Item and root pricing figures are in the store's tax
     * mode, which `is_tax_inclusive` reports.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> Pricing totals, priced items and available shipping methods.
     */
    public function to_array()
    {
        $result = $this->result;
        $context = $this->context;

        $shipping_service = app()->make(ShippingService::class);
        $shipping_options = $shipping_service->get_final_available_shipping_options($context);

        $items_subtotal = $this->get_items_subtotal($result->items);
        $order_discount = $this->get_order_coupon_discount($result->coupon_results);
        $shipping_amount = $result->base_shipping_subtotal - $result->base_shipping_discount;
        $order_total = $items_subtotal - $order_discount;

        return [
            'is_tax_inclusive' => (bool) Settings::get('tax.is_tax_inclusive_price', false),

            'totals' => [
                'base_items_subtotal_money_object' => Money::prepare_amount_object_from_minor($items_subtotal),

                'base_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount),

                'base_order_total_money_object' => Money::prepare_amount_object_from_minor($order_total),

                'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($result->base_tax_total),

                'base_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($shipping_amount),

                'base_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_subtotal),

                'base_total_money_object' => Money::prepare_amount_object_from_minor($result->base_total),

            ],

            'tax_lines' => $this->format_tax_breakdown(
                array_merge($this->flatten_item_tax_lines($result), $result->shipping_tax_lines)
            ),
            'coupons' => $this->format_coupon_results($result->coupon_results),

            'items_count' => $result->items_count,
            'items' => $this->prepare_items($result->items, $result),

            'available_shipping_methods' => array_map(function ($method) {
                $cost = $method['base_cost'];
                unset($method['base_cost']);
                $method['base_cost_money_object'] = Money::prepare_amount_object_from_minor($cost);
                return $method;
            }, $shipping_options),

            'shipping_method' => $result->shipping_method
        ];
    }

    /**
     * Build the priced line items, skipping items missing from the calculation result.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO[] $items  Items to render.
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO $result Calculation result holding the per-variant totals.
     * @return array<int, array<string, mixed>> Item amounts and applied product coupons.
     */
    protected function prepare_items($items, $result)
    {
        $cart_items = [];

        foreach ($items as $item) {
            if (isset($result->items[$item->variant_id])) {
                $calculated_item = $result->items[$item->variant_id];

                $subtotal = $calculated_item->base_catalog_product_coupon_discounted_subtotal;
                $strikethrough = $this->get_strikethrough_amount($calculated_item->base_catalog_regular_price, $calculated_item->base_catalog_sale_price, $subtotal, $item->quantity);

                $cart_items[] = [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($subtotal),
                    'base_strikethrough_price_money_object' => $strikethrough === null ? null : Money::prepare_amount_object_from_minor($strikethrough),
                    'base_unit_price_money_object' => $this->prepare_unit_amount_object($subtotal, $item->quantity),
                    'base_unit_strikethrough_price_money_object' => $this->prepare_unit_amount_object($strikethrough, $item->quantity),
                    'applied_product_coupons' => $this->get_applied_product_coupons_for_item($result->coupon_results, $item->variant_id),
                ];
            }
        }

        return $cart_items;
    }

    /**
     * Build the applied coupon summaries with their total discount.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results Coupon results from the calculation.
     * @return array<int, array<string, mixed>> Coupon details and discount amounts.
     */
    protected function format_coupon_results(array $coupon_results)
    {
        return array_map(function ($coupon_result) {
            $coupon = $coupon_result->coupon;
            $base_discount_amount_fixed = $coupon->base_discount_amount_fixed;

            return [
                'code' => $coupon->code,
                'title' => $coupon->title,
                'discount_type' => $coupon->discount_type,
                'discount_target' => $coupon->discount_target,
                'discount_value_type' => $coupon->discount_value_type,
                'discount_amount_percentage' => $coupon->discount_amount_percentage,
                'base_discount_amount_fixed_money_object' => !empty($base_discount_amount_fixed) ? Money::prepare_amount_object_from_minor($base_discount_amount_fixed) : null,
                'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($coupon_result->total_discount),
            ];
        }, $coupon_results);
    }

    /**
     * Sum every item's own subtotal - its catalog total after product-scoped
     * coupons only. An order-wide coupon's allocation is excluded so the root
     * items subtotal matches the sum of what each item's own subtotal shows.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO[] $calculated_items Calculated items, keyed by variant ID.
     * @return int Subtotal in minor units.
     */
    protected function get_items_subtotal(array $calculated_items)
    {
        $subtotal = 0;

        foreach ($calculated_items as $calculated_item) {
            $subtotal += $calculated_item->base_catalog_product_coupon_discounted_subtotal;
        }

        return $subtotal;
    }

    /**
     * Sum the discount from order-wide ("order") coupons against the items
     * subtotal only. Product-scoped coupons are excluded since they're
     * already reflected inside each item's own subtotal. A coupon's own
     * shipping-discount portion (e.g. an order-scoped free-shipping coupon)
     * is also excluded from `total_discount` here - that portion belongs to
     * the shipping discount, not the items subtotal.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results Coupon results from the calculation.
     * @return int Discount in minor units.
     */
    protected function get_order_coupon_discount(array $coupon_results)
    {
        $discount = 0;

        foreach ($coupon_results as $coupon_result) {
            if ($coupon_result->coupon->discount_target !== DiscountTarget::ORDER) {
                continue;
            }

            $discount += $coupon_result->total_discount - $coupon_result->shipping_discount;
        }

        return $discount;
    }

    /**
     * List the item-scoped coupons that actually discounted this item, for
     * per-item coupon badges. Cart-wide coupons never appear here.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results Coupon results from the calculation.
     * @param int                                                         $variant_id     Variant ID of the item.
     * @return array<int, array<string, mixed>> Coupon details with the discount this item received.
     */
    protected function get_applied_product_coupons_for_item(array $coupon_results, $variant_id)
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
            $base_discount_amount_fixed = $coupon->base_discount_amount_fixed;

            $applied[] = [
                'code' => $coupon->code,
                'title' => $coupon->title,
                'discount_value_type' => $coupon->discount_value_type,
                'discount_amount_percentage' => $coupon->discount_amount_percentage,
                'base_discount_amount_fixed_money_object' => !empty($base_discount_amount_fixed) ? Money::prepare_amount_object_from_minor($base_discount_amount_fixed) : null,
                'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($discount_amount),
            ];
        }

        return $applied;
    }

    /**
     * Aggregate a flat list of TaxLineDTO entries (e.g. every item's
     * tax_lines merged together) into one amount per tax name and rate. Entries
     * with a zero amount are dropped so a checkout summary never renders a
     * "Tax: $0.00" line when nothing was actually charged.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[] $tax_lines Tax lines to aggregate.
     * @return array<int, array<string, mixed>> Tax name, rate and base amount per group.
     */
    protected function format_tax_breakdown(array $tax_lines)
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
                'base_amount_money_object' => Money::prepare_amount_object_from_minor($entry['amount']),
            ];
        }

        return $breakdown;
    }

    /**
     * Prepare the per-unit money object for a line amount - see get_unit_amount().
     *
     * @since 1.0.0
     *
     * @param int|null $line_amount Line amount, in minor units, or null when there is none.
     * @param int      $quantity    The item's quantity.
     * @return \Kirki\Ecommerce\App\DTO\MoneyDTO|null Null when the line amount is null.
     */
    protected function prepare_unit_amount_object($line_amount, $quantity)
    {
        $unit_amount = $this->get_unit_amount($line_amount, $quantity);

        return $unit_amount === null ? null : Money::prepare_amount_object_from_minor($unit_amount);
    }

    /**
     * Merge every calculated item's tax lines into one flat list for
     * cart-wide aggregation by tax name and rate.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO $result Calculation result holding the items.
     * @return \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[] Every item's tax lines, unaggregated.
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
