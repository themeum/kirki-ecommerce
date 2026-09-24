<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Services\ShippingService;
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
    /**
     * Convert the calculation result to an array.
     *
     * Wraps the calculation result and context together with the requested currency code, and
     * adds the shipping options available for that context. Every monetary figure carries both
     * its base-currency and display-currency money object.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> Pricing totals, priced items and available shipping methods in base and display currencies.
     */
    public function to_array()
    {
        $result = $this->result;
        $context = $this->context;

        $shipping_service = app()->make(ShippingService::class);
        $shipping_options = $shipping_service->get_final_available_shipping_options($context);

        $display_currency = $this->currency_code ?? Money::resolve_display_currency();

        $items_subtotal = $this->get_items_subtotal($result->items, $result->coupon_results);
        $order_discount = $this->get_order_coupon_discount($result->coupon_results);
        $shipping_amount = $result->base_shipping_subtotal - $result->base_shipping_discount;

        return [
            'pricing' => [
                'base_items_subtotal_money_object' => Money::prepare_amount_object_from_minor($items_subtotal),
                'display_items_subtotal_money_object' => Money::prepare_amount_object_from_minor($items_subtotal, null, $display_currency),

                'base_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount),
                'display_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount, null, $display_currency),

                'base_order_total_money_object' => Money::prepare_amount_object_from_minor($items_subtotal - $order_discount),
                'display_order_total_money_object' => Money::prepare_amount_object_from_minor($items_subtotal - $order_discount, null, $display_currency),

                'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($result->base_tax_total),
                'display_tax_total_money_object' => Money::prepare_amount_object_from_minor($result->base_tax_total, null, $display_currency),

                'coupons' => $this->format_coupon_results($result->coupon_results, null, $display_currency),

                'base_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($shipping_amount),
                'display_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($shipping_amount, null, $display_currency),

                'base_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_subtotal),
                'display_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_subtotal, null, $display_currency),

                'base_total_money_object' => Money::prepare_amount_object_from_minor($result->base_total),
                'display_total_money_object' => Money::prepare_amount_object_from_minor($result->base_total, null, $display_currency),

                'tax_lines' => $this->format_tax_breakdown(
                    array_merge($this->flatten_item_tax_lines($result), $result->shipping_tax_lines),
                    null,
                    $display_currency
                ),
            ],

            'items_count' => $result->items_count,
            'items' => $this->prepare_items($result->items, $result, $display_currency),

            'available_shipping_methods' => array_map(function ($method) use ($display_currency) {
                $cost = $method['base_cost'];
                unset($method['base_cost']);
                $method['base_cost_money_object'] = Money::prepare_amount_object_from_minor($cost);
                $method['display_cost_money_object'] = Money::prepare_amount_object_from_minor($cost, null, $display_currency);
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
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO[] $items            Items to render.
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO $result           Calculation result holding the per-variant totals.
     * @param string                                                    $display_currency Currency code the amounts are converted to.
     * @return array<int, array<string, mixed>> Item amounts and applied product coupons.
     */
    protected function prepare_items($items, $result, $display_currency)
    {
        $cart_items = [];

        foreach ($items as $item) {
            if (isset($result->items[$item->variant_id])) {
                $calculated_item = $result->items[$item->variant_id];
                $product_coupon_discount = $this->get_product_coupon_discount_for_item($result->coupon_results, $item->variant_id);

                $cart_items[] = [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal - $product_coupon_discount),
                    'display_subtotal_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal - $product_coupon_discount, null, $display_currency),
                    'base_strikethrough_price_money_object' => $this->prepare_strikethrough_price($calculated_item, $product_coupon_discount, null, null),
                    'display_strikethrough_price_money_object' => $this->prepare_strikethrough_price($calculated_item, $product_coupon_discount, null, $display_currency),
                    'applied_product_coupons' => $this->get_applied_product_coupons_for_item($result->coupon_results, $item->variant_id, null, $display_currency),
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
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results     Coupon results from the calculation.
     * @param string|null                                                 $base_currency_code Currency code of the calculated amounts, or null for the store's base currency.
     * @param string                                                      $display_currency   Currency code the amounts are converted to.
     * @return array<int, array<string, mixed>> Coupon details and discount amounts.
     */
    protected function format_coupon_results(array $coupon_results, $base_currency_code, $display_currency)
    {
        return array_map(function ($coupon_result) use ($base_currency_code, $display_currency) {
            $coupon = $coupon_result->coupon;
            $base_discount_amount_fixed = $coupon->base_discount_amount_fixed;

            return [
                'code' => $coupon->code,
                'title' => $coupon->title,
                'discount_type' => $coupon->discount_type,
                'discount_target' => $coupon->discount_target,
                'discount_value_type' => $coupon->discount_value_type,
                'discount_amount_percentage' => $coupon->discount_amount_percentage,
                'base_discount_amount_fixed_money_object' => !empty($base_discount_amount_fixed) ? Money::prepare_amount_object_from_minor($base_discount_amount_fixed, $base_currency_code) : null,
                'display_discount_amount_fixed_money_object' => !empty($base_discount_amount_fixed) ? Money::prepare_amount_object_from_minor($base_discount_amount_fixed, $base_currency_code, $display_currency) : null,
                'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($coupon_result->total_discount, $base_currency_code),
                'display_discount_amount_money_object' => Money::prepare_amount_object_from_minor($coupon_result->total_discount, $base_currency_code, $display_currency),
            ];
        }, $coupon_results);
    }

    /**
     * Sum how much of an item's discount came from item-scoped ("product")
     * coupons only - cart-wide ("order") coupons are excluded so a line
     * item's display price never reflects an order-wide discount.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results Coupon results from the calculation.
     * @param int                                                         $variant_id     Variant ID of the item.
     * @return int Discount in minor units.
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
     * Sum every item's own subtotal, net of only that item's product-scoped
     * coupon - an order-wide coupon's allocation is excluded so the root
     * items subtotal matches the sum of what each item's own subtotal
     * shows.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO[]   $calculated_items Calculated items, keyed by variant ID.
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results   Coupon results from the calculation.
     * @return int Subtotal in minor units.
     */
    protected function get_items_subtotal(array $calculated_items, array $coupon_results)
    {
        $subtotal = 0;

        foreach ($calculated_items as $variant_id => $calculated_item) {
            $subtotal += $calculated_item->base_subtotal - $this->get_product_coupon_discount_for_item($coupon_results, $variant_id);
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
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results     Coupon results from the calculation.
     * @param int                                                         $variant_id         Variant ID of the item.
     * @param string|null                                                 $base_currency_code Currency code of the calculated amounts, or null for the store's base currency.
     * @param string                                                      $display_currency   Currency code the amounts are converted to.
     * @return array<int, array<string, mixed>> Coupon details with the discount this item received.
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
            $base_discount_amount_fixed = $coupon->base_discount_amount_fixed;

            $applied[] = [
                'code' => $coupon->code,
                'title' => $coupon->title,
                'discount_value_type' => $coupon->discount_value_type,
                'discount_amount_percentage' => $coupon->discount_amount_percentage,
                'base_discount_amount_fixed_money_object' => !empty($base_discount_amount_fixed) ? Money::prepare_amount_object_from_minor($base_discount_amount_fixed, $base_currency_code) : null,
                'display_discount_amount_fixed_money_object' => !empty($base_discount_amount_fixed) ? Money::prepare_amount_object_from_minor($base_discount_amount_fixed, $base_currency_code, $display_currency) : null,
                'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($discount_amount, $base_currency_code),
                'display_discount_amount_money_object' => Money::prepare_amount_object_from_minor($discount_amount, $base_currency_code, $display_currency),
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
     * @param \Kirki\Ecommerce\App\DTO\Tax\TaxLineDTO[] $tax_lines          Tax lines to aggregate.
     * @param string|null                                $base_currency_code Currency code of the calculated amounts, or null for the store's base currency.
     * @param string                                      $display_currency   Currency code the amounts are converted to.
     * @return array<int, array<string, mixed>> Tax name, rate, base amount and display amount per group.
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
                'base_amount_money_object' => Money::prepare_amount_object_from_minor($entry['amount'], $base_currency_code),
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
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO $calculated_item         Calculated line item.
     * @param int                                                     $product_coupon_discount Discount from item-scoped coupons, in minor units.
     * @param string|null                                             $base_currency_code      Currency code of the calculated amounts, or null for the store's base currency.
     * @param string|null                                             $display_currency        Currency code to convert to, or null to render in the base currency.
     * @return \Kirki\Ecommerce\App\DTO\MoneyDTO|null Null when nothing should be struck through.
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
