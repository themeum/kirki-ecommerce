<?php

namespace Kirki\Ecommerce\App\Resources\Concerns;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Facades\Money;

/**
 * Shapes a live CalculationResultDTO::$coupon_results (and its per-item tax
 * breakdowns) into the API's `coupons` / per-item pricing / tax arrays.
 * Shared by CartResource and OrderCalculationResource, which both render an
 * in-progress (not yet persisted) discount calculation.
 */
trait FormatsCouponResults
{
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
     * Aggregate a flat list of TaxItemResultDTO entries (e.g. every item's
     * tax_breakdown merged together) into one amount per tax name. Entries
     * with a zero amount are dropped so a checkout summary never renders a
     * "Tax: $0.00" line when nothing was actually charged.
     *
     * @param \Kirki\Ecommerce\App\DTO\Tax\TaxItemResultDTO[] $tax_items
     * @param string $base_currency_code
     * @param string $display_currency
     * @return array
     */
    protected function format_tax_breakdown(array $tax_items, $base_currency_code, $display_currency)
    {
        $totals_by_name = [];

        foreach ($tax_items as $tax_item) {
            if (empty($tax_item->base_amount)) {
                continue;
            }

            $name = $tax_item->name;

            if (!isset($totals_by_name[$name])) {
                $totals_by_name[$name] = ['rate' => $tax_item->rate, 'amount' => 0];
            }

            $totals_by_name[$name]['amount'] += $tax_item->base_amount;
        }

        $breakdown = [];

        foreach ($totals_by_name as $name => $entry) {
            $breakdown[] = [
                'name' => $name,
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
     * Merge every calculated item's product tax breakdown into one flat list
     * for cart-wide aggregation by tax name.
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO $result
     * @return \Kirki\Ecommerce\App\DTO\Tax\TaxItemResultDTO[]
     */
    protected function flatten_item_tax_breakdowns($result)
    {
        $tax_items = [];

        foreach ($result->items as $calculated_item) {
            foreach ($calculated_item->tax_breakdown as $tax_item) {
                $tax_items[] = $tax_item;
            }
        }

        return $tax_items;
    }
}
