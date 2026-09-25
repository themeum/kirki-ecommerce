<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Brick\Math\RoundingMode;
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
     * Wraps the calculation result and context together, and adds the shipping options
     * available for that context. Every monetary figure is a base-currency money object -
     * this payload is used only in the admin order create/recalculate screen, which prices
     * in the store's base currency.
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

        $items_subtotal = $this->get_items_subtotal($result->items, $result->coupon_results);
        $items_tax_total = $this->get_items_tax_total($result->items);
        $order_discount = $this->get_order_coupon_discount($result->coupon_results);
        $shipping_amount = $result->base_shipping_subtotal - $result->base_shipping_discount;
        $order_total = $items_subtotal - $order_discount;

        return [
            'totals' => [
                'base_items_subtotal_exclusive_money_object' => Money::prepare_amount_object_from_minor($items_subtotal),
                'base_items_subtotal_inclusive_money_object' => Money::prepare_amount_object_from_minor($this->derive_inclusive_amount($items_subtotal, $items_tax_total)),

                'base_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount),

                'base_order_total_exclusive_money_object' => Money::prepare_amount_object_from_minor($order_total),
                'base_order_total_inclusive_money_object' => Money::prepare_amount_object_from_minor($this->derive_inclusive_amount($order_total, $items_tax_total)),

                'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($result->base_tax_total),

                'coupons' => $this->format_coupon_results($result->coupon_results),

                'base_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($shipping_amount),

                'base_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($result->base_shipping_subtotal),

                'base_total_money_object' => Money::prepare_amount_object_from_minor($result->base_total),

                'tax_lines' => $this->format_tax_breakdown(
                    array_merge($this->flatten_item_tax_lines($result), $result->shipping_tax_lines)
                ),
            ],

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
                $product_coupon_discount = $this->get_product_coupon_discount_for_item($result->coupon_results, $item->variant_id);

                $subtotal_exclusive = $calculated_item->base_subtotal - $product_coupon_discount;
                $strikethrough = $this->prepare_strikethrough_price($calculated_item, $product_coupon_discount, $subtotal_exclusive);

                $cart_items[] = [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'base_subtotal_exclusive_money_object' => Money::prepare_amount_object_from_minor($subtotal_exclusive),
                    'base_subtotal_inclusive_money_object' => Money::prepare_amount_object_from_minor($this->derive_inclusive_amount($subtotal_exclusive, $calculated_item->base_tax_amount)),
                    'base_strikethrough_price_exclusive_money_object' => $strikethrough['exclusive'],
                    'base_strikethrough_price_inclusive_money_object' => $strikethrough['inclusive'],
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
     * Sum every calculated item's own tax - the items-only tax total used
     * to derive the root items-subtotal and order-total's inclusive
     * figures. Deliberately not `CalculationResultDTO::$base_tax_total`,
     * which also includes shipping tax and would overstate an items-only
     * inclusive figure.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO[] $calculated_items Calculated items, keyed by variant ID.
     * @return int Tax in minor units.
     */
    protected function get_items_tax_total(array $calculated_items)
    {
        $tax_total = 0;

        foreach ($calculated_items as $calculated_item) {
            $tax_total += $calculated_item->base_tax_amount;
        }

        return $tax_total;
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
     * The line item's "was" price before its current display price - the
     * sale-adjusted subtotal if a product coupon further discounted it,
     * otherwise the regular price if only a sale is active. Null when
     * neither applies, so nothing should render as struck through.
     *
     * Returns both a tax-exclusive and a tax-inclusive money object. The
     * strikethrough amount doesn't share the item's current-price taxed
     * base (it's a pre-discount or pre-sale figure), so the inclusive
     * figure is derived by scaling at the item's effective tax rate rather
     * than by adding its tax directly - see derive_inclusive_amount_at_rate().
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO $calculated_item         Calculated line item.
     * @param int                                                     $product_coupon_discount Discount from item-scoped coupons, in minor units.
     * @param int                                                     $subtotal_exclusive      The item's current-price exclusive subtotal, in minor units.
     * @return array{exclusive: \Kirki\Ecommerce\App\DTO\MoneyDTO|null, inclusive: \Kirki\Ecommerce\App\DTO\MoneyDTO|null} Both null when nothing should be struck through.
     */
    protected function prepare_strikethrough_price($calculated_item, $product_coupon_discount, $subtotal_exclusive)
    {
        if ($product_coupon_discount > 0) {
            $strikethrough_amount = $calculated_item->base_subtotal;
        } elseif ($calculated_item->base_subtotal < $calculated_item->base_product_total) {
            $strikethrough_amount = $calculated_item->base_product_total;
        } else {
            return ['exclusive' => null, 'inclusive' => null];
        }

        return [
            'exclusive' => Money::prepare_amount_object_from_minor($strikethrough_amount),
            'inclusive' => Money::prepare_amount_object_from_minor(
                $this->derive_inclusive_amount_at_rate($strikethrough_amount, $subtotal_exclusive, $calculated_item->base_tax_amount)
            ),
        ];
    }

    /**
     * Derive a tax-inclusive figure from a tax-exclusive one sharing the
     * same taxed base (an item's current subtotal, or an order/cart total) -
     * the two amounts were computed against the same base, so adding the
     * tax directly is exact.
     *
     * @since 1.0.0
     *
     * @param int $exclusive_amount Tax-exclusive amount, in minor units.
     * @param int $tax_amount       That same amount's own tax, in minor units.
     * @return int Tax-inclusive amount, in minor units.
     */
    protected function derive_inclusive_amount($exclusive_amount, $tax_amount)
    {
        return $exclusive_amount + $tax_amount;
    }

    /**
     * Derive a tax-inclusive figure for an amount that does not share the
     * taxed base (a strikethrough/regular-price figure) - scales by the
     * item's effective tax rate, reconstructed from its current-price
     * exclusive amount and tax, rather than adding that tax directly.
     *
     * @since 1.0.0
     *
     * @param int $exclusive_amount        Tax-exclusive amount to convert, in minor units.
     * @param int $current_price_exclusive The item's own current-price exclusive amount, in minor units.
     * @param int $current_price_tax       That current price's own tax, in minor units.
     * @return int Tax-inclusive amount, in minor units.
     */
    protected function derive_inclusive_amount_at_rate($exclusive_amount, $current_price_exclusive, $current_price_tax)
    {
        if ($current_price_exclusive <= 0) {
            return $exclusive_amount;
        }

        $rate_fraction = $current_price_tax / $current_price_exclusive;

        return Money::of_minor($exclusive_amount)
            ->plus(Money::of_minor($exclusive_amount)->multipliedBy($rate_fraction, RoundingMode::HALF_UP))
            ->getMinorAmount()->toInt();
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
