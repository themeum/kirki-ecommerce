<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Brick\Math\RoundingMode;
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
    /**
     * Convert the order resource to an array.
     *
     * Amounts are money objects, each carrying both the order's invoiced-currency figure and the store's base-currency figure.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The order data.
     */
    public function to_array()
    {
        $items = $this->items;
        $order_coupons = $this->order_coupons ?: collection();

        $items_subtotal = $this->get_items_subtotal($items, $order_coupons);
        $items_tax_total = $this->get_items_tax_total($items);
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

            'status' => $this->order_status,
            'fulfillment_status' => $this->fulfillment_status,
            'is_refund_initiated' => $this->is_refund_initiated,
            'is_manual' => $this->is_manual,
            'currency_code' => $this->currency_code,
            'is_tax_inclusive' => (bool) $this->is_tax_inclusive,

            'totals' => [
                'invoiced_items_subtotal_exclusive_money_object' => Money::prepare_amount_object_from_minor($items_subtotal['invoiced'], $this->currency_code),
                'invoiced_items_subtotal_inclusive_money_object' => Money::prepare_amount_object_from_minor($this->derive_inclusive_amount($items_subtotal['invoiced'], $items_tax_total['invoiced']), $this->currency_code),
                'base_items_subtotal_exclusive_money_object' => Money::prepare_amount_object_from_minor($items_subtotal['base']),
                'base_items_subtotal_inclusive_money_object' => Money::prepare_amount_object_from_minor($this->derive_inclusive_amount($items_subtotal['base'], $items_tax_total['base'])),
                'invoiced_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount['invoiced'], $this->currency_code),
                'base_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount['base']),
                'invoiced_order_total_exclusive_money_object' => Money::prepare_amount_object_from_minor($invoiced_order_total, $this->currency_code),
                'invoiced_order_total_inclusive_money_object' => Money::prepare_amount_object_from_minor($this->derive_inclusive_amount($invoiced_order_total, $items_tax_total['invoiced']), $this->currency_code),
                'base_order_total_exclusive_money_object' => Money::prepare_amount_object_from_minor($base_order_total),
                'base_order_total_inclusive_money_object' => Money::prepare_amount_object_from_minor($this->derive_inclusive_amount($base_order_total, $items_tax_total['base'])),
                'invoiced_tax_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_tax_total, $this->currency_code),
                'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($this->base_tax_total),
                'invoiced_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($invoiced_shipping_amount, $this->currency_code),
                'base_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($base_shipping_amount),
                'invoiced_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($invoiced_shipping_strikethrough, $this->currency_code),
                'base_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($base_shipping_strikethrough),
                'invoiced_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_total, $this->currency_code),
                'base_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total),
                'tax_lines' => $this->format_tax_breakdown(
                    array_merge($this->flatten_item_tax_lines($items), ($this->shipping_taxes ?: collection())->all())
                ),
            ],

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
            'customer_notes' => $this->customer_notes,
            'admin_notes' => $this->admin_notes,
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

            'archived_at' => $this->archived_at,
            'created_at' => $this->created_at,
        ];
    }

    /**
     * Build the admin-facing line items with net subtotals, tax lines and applied product coupons.
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
            $product_coupon_discount = $this->sum_product_coupon_discounts($item_discounts);

            $invoiced_subtotal_exclusive = $item->invoiced_subtotal - $product_coupon_discount['invoiced'];
            $base_subtotal_exclusive = $item->base_subtotal - $product_coupon_discount['base'];

            $invoiced_strikethrough = $this->prepare_strikethrough_price($item, $product_coupon_discount['invoiced'], $item->invoiced_subtotal, $item->invoiced_regular_price, $item->invoiced_regular_tax_total, $invoiced_subtotal_exclusive, $item->invoiced_tax_total, $this->currency_code);
            $base_strikethrough = $this->prepare_strikethrough_price($item, $product_coupon_discount['base'], $item->base_subtotal, $item->base_regular_price, $item->base_regular_tax_total, $base_subtotal_exclusive, $item->base_tax_total, null);

            $order_items[] = [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'product_name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'sku' => $item->sku,
                'image' => MediaAttachment::make($item->product_image),
                'quantity' => $item->quantity,
                'invoiced_subtotal_exclusive_money_object' => Money::prepare_amount_object_from_minor($invoiced_subtotal_exclusive, $this->currency_code),
                'invoiced_subtotal_inclusive_money_object' => Money::prepare_amount_object_from_minor($this->derive_inclusive_amount($invoiced_subtotal_exclusive, $item->invoiced_tax_total), $this->currency_code),
                'base_subtotal_exclusive_money_object' => Money::prepare_amount_object_from_minor($base_subtotal_exclusive),
                'base_subtotal_inclusive_money_object' => Money::prepare_amount_object_from_minor($this->derive_inclusive_amount($base_subtotal_exclusive, $item->base_tax_total)),
                'invoiced_strikethrough_price_exclusive_money_object' => $invoiced_strikethrough['exclusive'],
                'invoiced_strikethrough_price_inclusive_money_object' => $invoiced_strikethrough['inclusive'],
                'base_strikethrough_price_exclusive_money_object' => $base_strikethrough['exclusive'],
                'base_strikethrough_price_inclusive_money_object' => $base_strikethrough['inclusive'],
                'invoiced_tax_total_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_tax_total, $this->currency_code),
                'base_tax_total_money_object' => Money::prepare_amount_object_from_minor($item->base_tax_total),
                'tax_lines' => $this->format_tax_breakdown(($item->taxes ?: collection())->all()),
                'applied_product_coupons' => $this->format_applied_product_coupons($item_discounts),
            ];
        }

        return $order_items;
    }

    /**
     * The line item's "was" price before its current subtotal - the
     * sale-adjusted subtotal if a product coupon further discounted it,
     * otherwise the regular price total if it was bought on sale. Null when
     * neither applies, so nothing should render as struck through. The sale
     * check compares the base amounts so currency conversion rounding can't
     * make an item that wasn't on sale look discounted; an item with no
     * recorded regular price is never treated as on sale.
     *
     * Returns both a tax-exclusive and a tax-inclusive money object. When the
     * strikethrough amount is the item's regular-price total - either
     * because it's on sale with no item-level coupon, or because a coupon
     * applies while it isn't on sale (its pre-coupon subtotal then equals
     * its regular-price total) - the inclusive figure is the exclusive
     * figure plus the item's own recorded regular-price tax total, added
     * directly, since the two share that base exactly. Only when neither
     * holds (an item-level coupon applied while the item is simultaneously
     * on sale, so the pre-coupon subtotal is at the sale price, not the
     * regular price) is the inclusive figure instead derived by scaling at
     * the item's effective tax rate - see derive_inclusive_amount_at_rate().
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem $item                     Order item to price.
     * @param int                                    $product_coupon_discount  Discount from item-scoped coupons, in minor units, in the currency being rendered.
     * @param int                                    $subtotal_amount          The item's subtotal, in minor units, in the currency being rendered.
     * @param int                                    $regular_price_amount     The item's regular unit price, in minor units, in the currency being rendered.
     * @param int                                    $regular_tax_total        The item's regular-price total's own tax, in minor units, in the currency being rendered.
     * @param int                                    $current_price_exclusive  The item's current-price exclusive amount, in minor units, in the currency being rendered.
     * @param int                                    $current_price_tax        That current price's own tax, in minor units, in the currency being rendered.
     * @param string|null                            $currency_code            Currency code to render the amount in, or null for the store's base currency.
     * @return array{exclusive: \Kirki\Ecommerce\App\DTO\MoneyDTO|null, inclusive: \Kirki\Ecommerce\App\DTO\MoneyDTO|null} Both null when nothing should be struck through.
     */
    protected function prepare_strikethrough_price($item, $product_coupon_discount, $subtotal_amount, $regular_price_amount, $regular_tax_total, $current_price_exclusive, $current_price_tax, $currency_code)
    {
        if ($product_coupon_discount > 0) {
            $strikethrough_amount = $subtotal_amount;
        } elseif ($item->base_regular_price > $item->base_price) {
            $strikethrough_amount = $regular_price_amount * $item->quantity;
        } else {
            return ['exclusive' => null, 'inclusive' => null];
        }

        $regular_total = $regular_price_amount * $item->quantity;

        $inclusive_amount = $strikethrough_amount === $regular_total
            ? $this->derive_inclusive_amount($strikethrough_amount, $regular_tax_total)
            : $this->derive_inclusive_amount_at_rate($strikethrough_amount, $current_price_exclusive, $current_price_tax);

        return [
            'exclusive' => Money::prepare_amount_object_from_minor($strikethrough_amount, $currency_code),
            'inclusive' => Money::prepare_amount_object_from_minor($inclusive_amount, $currency_code),
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
     * Sum how much of an item's discount came from item-scoped ("product")
     * coupons only - order-wide coupons are excluded so a line item's
     * subtotal never reflects an order-wide discount.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon[] $order_coupons Coupons applied to the order.
     * @param int                                       $order_item_id Order item ID.
     * @return array{invoiced: int, base: int} Discount in minor units, per currency.
     */
    protected function get_product_coupon_discount_for_item($order_coupons, $order_item_id)
    {
        return $this->sum_product_coupon_discounts($this->find_product_coupon_discounts_for_item($order_coupons, $order_item_id));
    }

    /**
     * Sum a list of per-item product-coupon discounts (as returned by
     * `find_product_coupon_discounts_for_item()`) into the item's total
     * product-scoped discount.
     *
     * @since 1.0.0
     *
     * @param array<int, array{0: \Kirki\Ecommerce\App\Models\OrderCoupon, 1: \Kirki\Ecommerce\App\Models\OrderItemCoupon}> $item_discounts Coupon and discount row pairs for one item.
     * @return array{invoiced: int, base: int} Discount in minor units, per currency.
     */
    protected function sum_product_coupon_discounts($item_discounts)
    {
        $invoiced_discount = 0;
        $base_discount = 0;

        foreach ($item_discounts as [, $item_discount]) {
            $invoiced_discount += $item_discount->invoiced_discount_amount;
            $base_discount += $item_discount->base_discount_amount;
        }

        return ['invoiced' => $invoiced_discount, 'base' => $base_discount];
    }

    /**
     * Find how much each item-scoped ("product") coupon discounted this
     * specific item, paired with the coupon that granted it - shared by
     * `get_product_coupon_discount_for_item()` (which sums the amounts) and
     * `format_applied_product_coupons()` (which formats each pair for
     * display), so the PRODUCTS-scope/item-id filter lives in one place.
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
     * Sum every item's own subtotal, net of only that item's own
     * product-scoped coupon share - an order-wide coupon's allocation is
     * excluded so the root items subtotal matches the sum of what each
     * item's own subtotal shows.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem[]   $items         Items of the order.
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon[] $order_coupons Coupons applied to the order.
     * @return array{invoiced: int, base: int} Subtotal in minor units, per currency.
     */
    protected function get_items_subtotal($items, $order_coupons)
    {
        $invoiced_subtotal = 0;
        $base_subtotal = 0;

        foreach ($items as $item) {
            $discount = $this->get_product_coupon_discount_for_item($order_coupons, $item->id);
            $invoiced_subtotal += $item->invoiced_subtotal - $discount['invoiced'];
            $base_subtotal += $item->base_subtotal - $discount['base'];
        }

        return ['invoiced' => $invoiced_subtotal, 'base' => $base_subtotal];
    }

    /**
     * Sum every item's own recorded tax - the items-only tax total used to
     * derive the root items-subtotal and order-total's inclusive figures.
     * Deliberately not the order's own `invoiced_tax_total`/`base_tax_total`,
     * which also includes shipping tax and would overstate an items-only
     * inclusive figure.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem[] $items Items of the order.
     * @return array{invoiced: int, base: int} Tax in minor units, per currency.
     */
    protected function get_items_tax_total($items)
    {
        $invoiced_tax_total = 0;
        $base_tax_total = 0;

        foreach ($items as $item) {
            $invoiced_tax_total += $item->invoiced_tax_total;
            $base_tax_total += $item->base_tax_total;
        }

        return ['invoiced' => $invoiced_tax_total, 'base' => $base_tax_total];
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
