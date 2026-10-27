<?php

namespace Kirki\Ecommerce\App\Resources\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Concerns\ResolvesLineItemPricing;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\Framework\collection;

/**
 * API resource for a full order (admin), with totals, items, coupons, addresses and refunds.
 *
 * @since 1.0.0
 */
class OrderResource extends Resource
{
    use ResolvesLineItemPricing;

    /**
     * Convert the order resource to an array.
     *
     * Amounts are money objects, each carrying both the order's invoiced-currency figure and the store's base-currency figure.
     * Item and root pricing figures are in the tax mode recorded on the order, which `is_tax_inclusive` reports.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The order data.
     */
    public function to_array()
    {
        $items = $this->items;
        $order_coupons = $this->order_coupons ?: collection();

        $items_subtotal = $this->get_items_subtotal($items);
        $order_discount = $this->get_order_coupon_discount($order_coupons);
        $shipping_discount = $this->get_shipping_coupon_discount($order_coupons);

        $invoiced_order_total = $items_subtotal['invoiced'] - $order_discount['invoiced'];
        $base_order_total = $items_subtotal['base'] - $order_discount['base'];

        $invoiced_shipping_amount = $this->invoiced_shipping_total - $this->invoiced_shipping_tax_amount;
        $base_shipping_amount = $this->base_shipping_total - $this->base_shipping_tax_amount;
        $invoiced_shipping_strikethrough = $invoiced_shipping_amount + $shipping_discount['invoiced'];
        $base_shipping_strikethrough = $base_shipping_amount + $shipping_discount['base'];

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'order_number' => $this->order_number,
            'invoice_number' => $this->invoice_number,

            'customer_id' => $this->customer_id,
            'customer' => [
                'first_name' => $this->customer_first_name,
                'last_name' => $this->customer_last_name,
                'email' => $this->customer_email,
                'phone' => $this->customer_phone,
            ],
            'is_guest' => empty($this->customer) || empty($this->customer->user_id),

            'status' => $this->order_status,
            'fulfillment_status' => $this->fulfillment_status,
            'is_refund_initiated' => $this->is_refund_initiated,
            'is_manual' => $this->is_manual,
            'currency_code' => $this->currency_code,
            'is_tax_inclusive' => (bool) $this->is_tax_inclusive,
            'tax_destination' => $this->tax_destination,

            'totals' => [
                'invoiced_items_subtotal_money_object' => Money::prepare_amount_object_from_minor($items_subtotal['invoiced'], $this->currency_code),
                'base_items_subtotal_money_object' => Money::prepare_amount_object_from_minor($items_subtotal['base']),
                'invoiced_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount['invoiced'], $this->currency_code),
                'base_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount['base']),
                'invoiced_order_total_money_object' => Money::prepare_amount_object_from_minor($invoiced_order_total, $this->currency_code),
                'base_order_total_money_object' => Money::prepare_amount_object_from_minor($base_order_total),
                'invoiced_tax_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_tax_total, $this->currency_code),
                'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($this->base_tax_total),
                'invoiced_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($invoiced_shipping_amount, $this->currency_code),
                'base_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($base_shipping_amount),
                'invoiced_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($invoiced_shipping_strikethrough, $this->currency_code),
                'base_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($base_shipping_strikethrough),
                'invoiced_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_total, $this->currency_code),
                'base_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total),
            ],

            'tax_lines' => $this->format_tax_breakdown(
                array_merge($this->flatten_item_tax_lines($items), ($this->shipping_taxes ?: collection())->all())
            ),
            'coupons' => $this->format_coupon_results($order_coupons),

            'items_count' => $this->items_count,
            'items' => $this->prepare_items($items, $order_coupons),

            'shipping_address' => [
                'first_name' => $this->shipping_first_name,
                'last_name' => $this->shipping_last_name,
                'address_line1' => $this->shipping_address_line1,
                'address_line2' => $this->shipping_address_line2,
                'city' => $this->shipping_city,
                'state' => $this->shipping_state,
                'country' => $this->shipping_country,
                'postal_code' => $this->shipping_postal_code,
                'phone' => $this->shipping_phone,
                'email' => $this->shipping_email,
            ],

            'is_billing_same_as_shipping' => (bool) $this->is_billing_same_as_shipping,

            'billing_address' => [
                'first_name' => $this->billing_first_name,
                'last_name' => $this->billing_last_name,
                'address_line1' => $this->billing_address_line1,
                'address_line2' => $this->billing_address_line2,
                'city' => $this->billing_city,
                'state' => $this->billing_state,
                'country' => $this->billing_country,
                'postal_code' => $this->billing_postal_code,
                'phone' => $this->billing_phone,
                'email' => $this->billing_email,
            ],

            'payment_provider' => $this->payment_provider,
            'payment_provider_name' => $this->payment_metadata['payment_provider']['name'] ?? null,
            'payment_provider_icon' => $this->payment_metadata['payment_provider']['icon'] ?? null,
            'payment_provider_is_offline' => $this->payment_metadata['payment_provider']['is_offline'] ?? null,
            'payment_status' => $this->payment_status,
            'shipping_method' => $this->shipping_method,
            'shipping_method_name' => $this->shipping_metadata['shipping_method']['name'] ?? null,
            'shipping_method_type' => $this->shipping_metadata['shipping_method']['type'] ?? null,
            'order_notes' => $this->order_notes,
            'flags' => $this->flags,

            'shipping_tracking' => [
                'carrier' => $this->shipping_carrier,
                'tracking_number' => $this->shipping_tracking_number,
                'tracking_url' => $this->shipping_tracking_url,
            ],

            'refunds' => empty($this->refunds) ? [] : $this->refunds->map(function ($refund) {
                return [
                    'id' => $refund->id,
                    'invoiced_amount_money_object' => Money::prepare_amount_object_from_minor($refund->invoiced_amount, $this->currency_code),
                    'type' => $refund->refund_type,
                    'reason' => $refund->reason,
                    'transaction_id' => $refund->refund_id,
                    'status' => $refund->status,
                    'created_at' => $refund->created_at,
                    'created_by' => $refund->created_by,
                ];
            }),

            'estimated_delivery_date' => $this->estimated_delivery_date,
            'archived_at' => $this->archived_at,
            'created_at' => $this->created_at,
            'cancelled_at' => $this->cancelled_at,
            'paid_at' => $this->paid_at,
            'shipped_at' => $this->shipped_at,
            'fulfilled_at' => $this->fulfilled_at,
        ];
    }

    /**
     * Build the admin-facing line items with subtotals, tax lines and applied product coupons.
     *
     * Subtotals and strikethrough prices are the item's recorded catalog
     * figures, so they include tax exactly when the order was priced
     * inclusive of tax.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem[]   $items         Items of the order.
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon[] $order_coupons Coupons applied to the order.
     * @return array<int, array<string, mixed>> Line item data.
     */
    protected function prepare_items($items, $order_coupons)
    {
        $order_items = [];

        foreach ($items as $item) {
            $item_discounts = $this->find_product_coupon_discounts_for_item($order_coupons, $item->id);
            $strikethrough = $this->get_order_item_strikethrough_amounts($item);

            $order_items[] = [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'product_name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'sku' => $item->sku,
                'image' => MediaAttachment::make($item->product_image),
                'quantity' => $item->quantity,
                'invoiced_subtotal_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_catalog_product_coupon_discounted_subtotal, $this->currency_code),
                'base_subtotal_money_object' => Money::prepare_amount_object_from_minor($item->base_catalog_product_coupon_discounted_subtotal),
                'invoiced_strikethrough_price_money_object' => $strikethrough['invoiced'] === null ? null : Money::prepare_amount_object_from_minor($strikethrough['invoiced'], $this->currency_code),
                'base_strikethrough_price_money_object' => $strikethrough['base'] === null ? null : Money::prepare_amount_object_from_minor($strikethrough['base']),
                'invoiced_unit_price_money_object' => $this->prepare_unit_amount_object($item->invoiced_catalog_product_coupon_discounted_subtotal, $item->quantity, $this->currency_code),
                'base_unit_price_money_object' => $this->prepare_unit_amount_object($item->base_catalog_product_coupon_discounted_subtotal, $item->quantity, null),
                'invoiced_unit_strikethrough_price_money_object' => $this->prepare_unit_amount_object($strikethrough['invoiced'], $item->quantity, $this->currency_code),
                'base_unit_strikethrough_price_money_object' => $this->prepare_unit_amount_object($strikethrough['base'], $item->quantity, null),
                'invoiced_tax_total_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_tax_total, $this->currency_code),
                'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($item->base_tax_total),
                'tax_lines' => $this->format_tax_breakdown(($item->taxes ?: collection())->all()),
                'applied_product_coupons' => $this->format_applied_product_coupons($item_discounts),
            ];
        }

        return $order_items;
    }

    /**
     * Prepare the per-unit money object for a line amount - see get_unit_amount().
     *
     * @since 1.0.0
     *
     * @param int|null    $line_amount   Line amount, in minor units, or null when there is none.
     * @param int         $quantity      The item's quantity.
     * @param string|null $currency_code Currency code to render the amount in, or null for the store's base currency.
     * @return \Kirki\Ecommerce\App\DTO\MoneyDTO|null Null when the line amount is null.
     */
    protected function prepare_unit_amount_object($line_amount, $quantity, $currency_code)
    {
        $unit_amount = $this->get_unit_amount($line_amount, $quantity);

        return $unit_amount === null ? null : Money::prepare_amount_object_from_minor($unit_amount, $currency_code);
    }

    /**
     * Build the order-level coupon summaries with their invoiced and base discount amounts and snapshot fields.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\Framework\Collections\Collection $order_coupons Coupons applied to the order.
     * @return array<int, array<string, mixed>> Coupon details.
     */
    protected function format_coupon_results($order_coupons)
    {
        return $order_coupons->map(function ($order_coupon) {
            return array_merge([
                'id' => $order_coupon->id,
                'coupon_id' => $order_coupon->coupon_id,
                'code' => $order_coupon->code,
                'title' => $order_coupon->title,
                'discount_type' => $order_coupon->discount_type,
                'discount_target' => $order_coupon->discount_target,
                'invoiced_discount_amount_money_object' => Money::prepare_amount_object_from_minor($order_coupon->invoiced_discount_amount, $this->currency_code),
                'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($order_coupon->base_discount_amount),
                'usage_reversed_at' => $order_coupon->usage_reversed_at,
            ], $this->format_coupon_snapshot_fields($order_coupon));
        })->to_array();
    }

    /**
     * Format a list of per-item product-coupon discounts (as returned by
     * `find_product_coupon_discounts_for_item()`) into per-item coupon
     * badges, dropping any discount clamped down to zero.
     *
     * @since 1.0.0
     *
     * @param array<int, array{0: \Kirki\Ecommerce\App\Models\OrderCoupon, 1: \Kirki\Ecommerce\App\Models\OrderItemCoupon}> $item_discounts Coupon and discount row pairs for one item.
     * @return array<int, array<string, mixed>> Coupon badge data.
     */
    protected function format_applied_product_coupons($item_discounts)
    {
        $applied = [];

        foreach ($item_discounts as [$order_coupon, $item_discount]) {
            if ($item_discount->invoiced_discount_amount <= 0) {
                continue;
            }

            $applied[] = array_merge([
                'code' => $order_coupon->code,
                'title' => $order_coupon->title,
                'invoiced_discount_amount_money_object' => Money::prepare_amount_object_from_minor($item_discount->invoiced_discount_amount, $this->currency_code),
                'base_discount_amount_money_object' => Money::prepare_amount_object_from_minor($item_discount->base_discount_amount),
            ], $this->format_coupon_snapshot_fields($order_coupon));
        }

        return $applied;
    }

    /**
     * The coupon's own configured discount fields (percentage or fixed
     * amount), read from its checkout-time snapshot rather than a live
     * `Coupon` model. `discount_amount_fixed` is stored in the snapshot in
     * the store's base currency (`base_discount_amount_fixed`); the base
     * money object reads it directly, and the invoiced money object
     * converts it using the order's own frozen `exchange_rate` - not a
     * live rate lookup, since this is historical order data.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon $order_coupon Coupon applied to the order.
     * @return array<string, mixed> Discount value type, percentage and fixed amount as money objects.
     */
    protected function format_coupon_snapshot_fields($order_coupon)
    {
        $snapshot = $order_coupon->coupon_snapshot ?: [];
        $base_discount_amount_fixed = $snapshot['base_discount_amount_fixed'] ?? null;

        return [
            'discount_value_type' => $snapshot['discount_value_type'] ?? null,
            'discount_amount_percentage' => $snapshot['discount_amount_percentage'] ?? null,
            'invoiced_discount_amount_fixed_money_object' => !empty($base_discount_amount_fixed)
                ? $this->convert_base_amount_to_invoiced($base_discount_amount_fixed)
                : null,
            'base_discount_amount_fixed_money_object' => !empty($base_discount_amount_fixed)
                ? Money::prepare_amount_object_from_minor($base_discount_amount_fixed)
                : null,
        ];
    }

    /**
     * Convert a base-currency minor amount into the order's own invoiced
     * currency using the order's frozen `exchange_rate` - never a live
     * rate, since the order's own conversion rate is fixed at checkout.
     *
     * @since 1.0.0
     *
     * @param int $base_amount Amount in the base currency's minor units.
     * @return \Kirki\Ecommerce\App\DTO\MoneyDTO Amount in the order's invoiced currency.
     */
    protected function convert_base_amount_to_invoiced($base_amount)
    {
        $money = Money::from_minor($base_amount, $this->base_currency_code);
        $converted = Money::convert_to_currency($money, $this->currency_code, $this->exchange_rate);

        return Money::to_dto($converted->getMinorAmount()->toInt(), $this->currency_code);
    }

    /**
     * Find how much each item-scoped ("product") coupon discounted this
     * specific item, paired with the coupon that granted it, for
     * `format_applied_product_coupons()` to format each pair for display.
     *
     * Each entry is `[OrderCoupon $coupon, OrderItemCoupon $item_discount]`
     * - the coupon and the discount row it recorded for this item.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon[] $order_coupons Coupons applied to the order.
     * @param int                                       $order_item_id Order item ID.
     * @return array<int, array{0: \Kirki\Ecommerce\App\Models\OrderCoupon, 1: \Kirki\Ecommerce\App\Models\OrderItemCoupon}> Coupon and discount row pairs.
     */
    protected function find_product_coupon_discounts_for_item($order_coupons, $order_item_id)
    {
        $item_discounts = [];

        foreach ($order_coupons as $order_coupon) {
            if ($order_coupon->discount_target !== DiscountTarget::PRODUCTS) {
                continue;
            }

            foreach (($order_coupon->order_item_coupons ?: collection()) as $item_discount) {
                if ($item_discount->order_item_id === $order_item_id) {
                    $item_discounts[] = [$order_coupon, $item_discount];
                }
            }
        }

        return $item_discounts;
    }

    /**
     * Sum every item's own subtotal - its recorded catalog total after
     * product-scoped coupons only. An order-wide coupon's allocation is
     * excluded so the root items subtotal matches the sum of what each
     * item's own subtotal shows.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem[] $items Items of the order.
     * @return array{invoiced: int, base: int} Subtotal in minor units, per currency.
     */
    protected function get_items_subtotal($items)
    {
        $invoiced_subtotal = 0;
        $base_subtotal = 0;

        foreach ($items as $item) {
            $invoiced_subtotal += $item->invoiced_catalog_product_coupon_discounted_subtotal;
            $base_subtotal += $item->base_catalog_product_coupon_discounted_subtotal;
        }

        return ['invoiced' => $invoiced_subtotal, 'base' => $base_subtotal];
    }

    /**
     * Sum the discount from order-wide ("order") coupons that was actually
     * attributed to items - i.e. the sum of each such coupon's own
     * `order_item_coupons` rows. A coupon's own shipping-discount portion
     * (e.g. an order-scoped free-shipping coupon) has no item attribution
     * at all (`order-coupon-attribution`), so it's naturally excluded here
     * and belongs to the shipping discount instead.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon[] $order_coupons Coupons applied to the order.
     * @return array{invoiced: int, base: int} Discount in minor units, per currency.
     */
    protected function get_order_coupon_discount($order_coupons)
    {
        $invoiced_discount = 0;
        $base_discount = 0;

        foreach ($order_coupons as $order_coupon) {
            if ($order_coupon->discount_target !== DiscountTarget::ORDER) {
                continue;
            }

            $invoiced_discount += ($order_coupon->order_item_coupons ?: collection())->sum(function ($item_discount) {
                return $item_discount->invoiced_discount_amount;
            });

            $base_discount += ($order_coupon->order_item_coupons ?: collection())->sum(function ($item_discount) {
                return $item_discount->base_discount_amount;
            });
        }

        return ['invoiced' => $invoiced_discount, 'base' => $base_discount];
    }

    /**
     * Sum the discount from order-wide ("order") coupons that was NOT
     * attributed to any item - the remainder of each such coupon's total
     * discount after subtracting its own item attributions. By
     * `order-coupon-attribution`'s reconciliation guarantee, that remainder
     * is exactly the shipping discount that coupon granted (non-zero only
     * for a free-shipping order-coupon, which has no item attributions at
     * all).
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon[] $order_coupons Coupons applied to the order.
     * @return array{invoiced: int, base: int} Discount in minor units, per currency.
     */
    protected function get_shipping_coupon_discount($order_coupons)
    {
        $invoiced_discount = 0;
        $base_discount = 0;

        foreach ($order_coupons as $order_coupon) {
            if ($order_coupon->discount_target !== DiscountTarget::ORDER) {
                continue;
            }

            $invoiced_items_share = ($order_coupon->order_item_coupons ?: collection())->sum(function ($item_discount) {
                return $item_discount->invoiced_discount_amount;
            });

            $base_items_share = ($order_coupon->order_item_coupons ?: collection())->sum(function ($item_discount) {
                return $item_discount->base_discount_amount;
            });

            $invoiced_discount += $order_coupon->invoiced_discount_amount - $invoiced_items_share;
            $base_discount += $order_coupon->base_discount_amount - $base_items_share;
        }

        return ['invoiced' => $invoiced_discount, 'base' => $base_discount];
    }

    /**
     * Aggregate a flat list of persisted order_taxes rows into one amount
     * per tax name and rate. Entries with a zero invoiced amount are
     * dropped so the summary never renders a "Tax: $0.00" line when
     * nothing was actually charged.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderTax[] $tax_lines Tax rows to aggregate.
     * @return array<int, array<string, mixed>> Tax name, rate and invoiced/base amount per group.
     */
    protected function format_tax_breakdown(array $tax_lines)
    {
        $totals_by_key = [];

        foreach ($tax_lines as $tax_line) {
            if (empty($tax_line->invoiced_amount)) {
                continue;
            }

            $key = $tax_line->name . '|' . $tax_line->rate;

            if (!isset($totals_by_key[$key])) {
                $totals_by_key[$key] = ['name' => $tax_line->name, 'rate' => $tax_line->rate, 'invoiced_amount' => 0, 'base_amount' => 0];
            }

            $totals_by_key[$key]['invoiced_amount'] += $tax_line->invoiced_amount;
            $totals_by_key[$key]['base_amount'] += $tax_line->base_amount;
        }

        $breakdown = [];

        foreach ($totals_by_key as $entry) {
            $breakdown[] = [
                'name' => $entry['name'],
                'rate' => $entry['rate'],
                'invoiced_amount_money_object' => Money::prepare_amount_object_from_minor($entry['invoiced_amount'], $this->currency_code),
                'base_amount_money_object' => Money::prepare_amount_object_from_minor($entry['base_amount']),
            ];
        }

        return $breakdown;
    }

    /**
     * Merge every order item's tax lines into one flat list for order-wide
     * aggregation by tax name and rate.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem[] $items Items of the order.
     * @return \Kirki\Ecommerce\App\Models\OrderTax[] Every item's tax rows, unaggregated.
     */
    protected function flatten_item_tax_lines($items)
    {
        $tax_lines = [];

        foreach ($items as $item) {
            foreach (($item->taxes ?: collection()) as $tax_line) {
                $tax_lines[] = $tax_line;
            }
        }

        return $tax_lines;
    }
}
