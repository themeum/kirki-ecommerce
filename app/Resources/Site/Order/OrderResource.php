<?php

namespace Kirki\Ecommerce\App\Resources\Site\Order;

use Brick\Math\RoundingMode;
use Exception;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Services\CountryService;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

/**
 * API resource for a single order as shown to the customer on the storefront.
 *
 * @since 1.0.0
 */
class OrderResource extends Resource
{
    /**
     * Convert the order resource to an array.
     *
     * Amounts are money objects in the order's invoiced currency, and the next payment step is resolved for unsettled orders.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The customer-facing order data.
     */
    public function to_array()
    {
        $items = $this->items;
        $order_coupons = $this->order_coupons ?: collection();
        $is_inclusive_tax = (bool) $this->is_tax_inclusive;

        $invoiced_items_subtotal = $this->get_items_subtotal($items, $order_coupons);
        $invoiced_items_tax_total = $this->get_items_tax_total($items);
        $invoiced_order_discount = $this->get_order_coupon_discount($order_coupons);
        $invoiced_shipping_discount = $this->get_shipping_coupon_discount($order_coupons);
        $invoiced_shipping_amount = $this->invoiced_shipping_total - $this->invoiced_shipping_tax_amount;
        $invoiced_shipping_strikethrough = $invoiced_shipping_amount + $invoiced_shipping_discount;

        // Every item's own invoiced_subtotal is always net of tax as of
        // item-pricing-tax-exclusivity; this resource's output must not
        // change, so under tax-inclusive pricing the items-only tax is
        // added back to reconstruct the same figure this rendered before -
        // exact, since both are computed against the same (post-discount)
        // taxable base.
        $invoiced_items_subtotal_display = $is_inclusive_tax ? $invoiced_items_subtotal + $invoiced_items_tax_total : $invoiced_items_subtotal;

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'order_number' => $this->order_number,
            'invoice_number' => $this->invoice_number,
            'customer_id' => $this->customer_id,
            'status' => $this->order_status,
            'fulfillment_status' => $this->fulfillment_status,
            'is_refund_initiated' => $this->is_refund_initiated,
            'is_manual' => $this->is_manual,
            'currency_code' => $this->currency_code,

            'pricing' => [
                'invoiced_items_subtotal_money_object' => Money::prepare_amount_object_from_minor($invoiced_items_subtotal_display, $this->currency_code),
                'invoiced_order_discount_money_object' => Money::prepare_amount_object_from_minor($invoiced_order_discount, $this->currency_code),
                'invoiced_order_total_money_object' => Money::prepare_amount_object_from_minor($invoiced_items_subtotal_display - $invoiced_order_discount, $this->currency_code),
                'invoiced_tax_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_tax_total, $this->currency_code),
                'coupons' => $this->format_coupon_results($order_coupons),
                'invoiced_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($invoiced_shipping_amount, $this->currency_code),
                'invoiced_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($invoiced_shipping_strikethrough, $this->currency_code),
                'invoiced_total_money_object' => Money::prepare_amount_object_from_minor($this->invoiced_total, $this->currency_code),
                'tax_lines' => $this->format_tax_breakdown(
                    array_merge($this->flatten_item_tax_lines($items), ($this->shipping_taxes ?: collection())->all())
                ),
            ],

            'items_count' => $this->items_count,
            'items' => $this->prepare_items($items, $order_coupons, $is_inclusive_tax),

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
            'updated_at' => $this->updated_at,

            'shipping_country' => app(CountryService::class)->find($this->shipping_country),
            'billing_country' => app(CountryService::class)->find($this->billing_country),
            'formatted_status' => FulfillmentStatus::get_formatted($this->fulfillment_status),
            'payment_next_step' => $this->resolve_payment_next_step(),
            'item_product_data' => $items->map(function ($item) {
                return $item->product_data;
            })->to_array(),
            'customer' => $this->customer_id ? customer(null, $this->customer_id)->get_customer() : [],
        ];
    }

    /**
     * Build the customer-facing line items with net subtotals, tax lines and applied product coupons.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem[]   $items            Items of the order.
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon[] $order_coupons    Coupons applied to the order.
     * @param bool                                      $is_inclusive_tax Whether the store prices items inclusive of tax.
     * @return array<int, array<string, mixed>> Line item data.
     */
    protected function prepare_items($items, $order_coupons, $is_inclusive_tax)
    {
        $order_items = [];

        foreach ($items as $item) {
            $item_discounts = $this->find_product_coupon_discounts_for_item($order_coupons, $item->id);
            $invoiced_product_coupon_discount = $this->sum_product_coupon_discounts($item_discounts);

            // The item's own invoiced_subtotal is always net of tax as of
            // this fix; under tax-inclusive pricing, add the item's own tax
            // back to reconstruct the same figure this rendered before
            // (exact - same base as invoiced_tax_total).
            $invoiced_subtotal_exclusive = $item->invoiced_subtotal - $invoiced_product_coupon_discount;
            $invoiced_subtotal_display = $is_inclusive_tax ? $invoiced_subtotal_exclusive + $item->invoiced_tax_total : $invoiced_subtotal_exclusive;

            $order_items[] = [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant_id,
                'product_name' => $item->product_name,
                'variant_name' => $item->variant_name,
                'sku' => $item->sku,
                'image' => MediaAttachment::make($item->product_image),
                'quantity' => $item->quantity,
                'invoiced_subtotal_money_object' => Money::prepare_amount_object_from_minor($invoiced_subtotal_display, $this->currency_code),
                'invoiced_strikethrough_price_money_object' => $this->prepare_strikethrough_price($item, $invoiced_product_coupon_discount, $invoiced_subtotal_exclusive, $is_inclusive_tax),
                'invoiced_tax_total_money_object' => Money::prepare_amount_object_from_minor($item->invoiced_tax_total, $this->currency_code),
                'tax_lines' => $this->format_tax_breakdown(($item->taxes ?: collection())->all()),
                'applied_product_coupons' => $this->format_applied_product_coupons($item_discounts),
            ];
        }

        return $order_items;
    }

    /**
     * The line item's "was" price before its current invoiced subtotal - the
     * sale-adjusted subtotal if a product coupon further discounted it,
     * otherwise the regular price total if it was bought on sale. Null when
     * neither applies, so nothing should render as struck through. The sale
     * check compares the base amounts so currency conversion rounding can't
     * make an item that wasn't on sale look discounted; an item with no
     * recorded regular price is never treated as on sale.
     *
     * Both figures are always net of tax as of this fix; under
     * tax-inclusive pricing the result is scaled back up to reconstruct the
     * same figure this rendered before. When the strikethrough amount is the
     * item's regular-price total (`invoiced_regular_price * quantity`) -
     * either because it's on sale with no item-level coupon, or because a
     * coupon applies while it isn't on sale (its pre-coupon subtotal then
     * equals its regular-price total) - that's a flat addition of the
     * item's own `invoiced_regular_tax_total`, since the two share that base
     * exactly. Only when neither holds (an item-level coupon applied while
     * the item is simultaneously on sale) is it instead scaled by the
     * item's effective tax rate.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem $item                             Order item to price.
     * @param int                                   $invoiced_product_coupon_discount Discount from item-scoped coupons, in minor units.
     * @param int                                   $invoiced_subtotal_exclusive      The item's current-price exclusive subtotal, in minor units.
     * @param bool                                  $is_inclusive_tax                 Whether the store prices items inclusive of tax.
     * @return \Kirki\Ecommerce\App\DTO\MoneyDTO|null Null when nothing should be struck through.
     */
    protected function prepare_strikethrough_price($item, $invoiced_product_coupon_discount, $invoiced_subtotal_exclusive, $is_inclusive_tax)
    {
        if ($invoiced_product_coupon_discount > 0) {
            $strikethrough_amount = $item->invoiced_subtotal;
        } elseif ($item->base_regular_price > $item->base_price) {
            $strikethrough_amount = $item->invoiced_regular_price * $item->quantity;
        } else {
            return null;
        }

        if ($is_inclusive_tax) {
            $regular_total = $item->invoiced_regular_price * $item->quantity;

            $strikethrough_amount = $strikethrough_amount === $regular_total
                ? $strikethrough_amount + $item->invoiced_regular_tax_total
                : $this->derive_inclusive_amount_at_rate($strikethrough_amount, $invoiced_subtotal_exclusive, $item->invoiced_tax_total);
        }

        return Money::prepare_amount_object_from_minor($strikethrough_amount, $this->currency_code);
    }

    /**
     * Build the applied coupon summaries with their invoiced discount and snapshot fields.
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
                'code' => $order_coupon->code,
                'title' => $order_coupon->title,
                'discount_type' => $order_coupon->discount_type,
                'discount_target' => $order_coupon->discount_target,
                'invoiced_discount_amount_money_object' => Money::prepare_amount_object_from_minor($order_coupon->invoiced_discount_amount, $this->currency_code),
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
            ], $this->format_coupon_snapshot_fields($order_coupon));
        }

        return $applied;
    }

    /**
     * The coupon's own configured discount fields (percentage or fixed
     * amount), read from its checkout-time snapshot rather than a live
     * `Coupon` model. `discount_amount_fixed` is stored in the snapshot in
     * the store's base currency (`base_discount_amount_fixed`), so it's
     * converted here using the order's own frozen `exchange_rate` - not a
     * live rate lookup, since this is historical order data.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon $order_coupon Coupon applied to the order.
     * @return array<string, mixed> Discount value type, percentage and fixed amount as a money object.
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
     * @return int Discount in minor units.
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
     * @return int Discount in minor units.
     */
    protected function sum_product_coupon_discounts($item_discounts)
    {
        $invoiced_discount = 0;

        foreach ($item_discounts as [, $item_discount]) {
            $invoiced_discount += $item_discount->invoiced_discount_amount;
        }

        return $invoiced_discount;
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
     * Sum every item's own invoiced subtotal, net of only that item's
     * product-scoped coupon share - an order-wide coupon's allocation is
     * excluded so the root items subtotal matches the sum of what each
     * item's own subtotal shows.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem[]   $items         Items of the order.
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon[] $order_coupons Coupons applied to the order.
     * @return int Subtotal in minor units.
     */
    protected function get_items_subtotal($items, $order_coupons)
    {
        $invoiced_subtotal = 0;

        foreach ($items as $item) {
            $invoiced_subtotal += $item->invoiced_subtotal - $this->get_product_coupon_discount_for_item($order_coupons, $item->id);
        }

        return $invoiced_subtotal;
    }

    /**
     * Sum every item's own recorded tax - used to reconstruct the pre-fix
     * root subtotal figure under tax-inclusive pricing (see to_array()).
     * Deliberately not the order's own `invoiced_tax_total` model field,
     * which also includes shipping tax and would overstate the
     * reconstructed items subtotal.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem[] $items Items of the order.
     * @return int Tax in minor units.
     */
    protected function get_items_tax_total($items)
    {
        $tax_total = 0;

        foreach ($items as $item) {
            $tax_total += $item->invoiced_tax_total;
        }

        return $tax_total;
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
     * @return int Discount in minor units.
     */
    protected function get_order_coupon_discount($order_coupons)
    {
        $invoiced_discount = 0;

        foreach ($order_coupons as $order_coupon) {
            if ($order_coupon->discount_target !== DiscountTarget::ORDER) {
                continue;
            }

            $invoiced_discount += ($order_coupon->order_item_coupons ?: collection())->sum(function ($item_discount) {
                return $item_discount->invoiced_discount_amount;
            });
        }

        return $invoiced_discount;
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
     * @return int Discount in minor units.
     */
    protected function get_shipping_coupon_discount($order_coupons)
    {
        $invoiced_discount = 0;

        foreach ($order_coupons as $order_coupon) {
            if ($order_coupon->discount_target !== DiscountTarget::ORDER) {
                continue;
            }

            $invoiced_items_share = ($order_coupon->order_item_coupons ?: collection())->sum(function ($item_discount) {
                return $item_discount->invoiced_discount_amount;
            });

            $invoiced_discount += $order_coupon->invoiced_discount_amount - $invoiced_items_share;
        }

        return $invoiced_discount;
    }

    /**
     * Aggregate a flat list of OrderTax rows into one amount per tax name
     * and rate. Entries with a zero amount are dropped so the summary never
     * renders a "Tax: $0.00" line when nothing was actually charged.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderTax[] $tax_lines Tax rows to aggregate.
     * @return array<int, array<string, mixed>> Tax name, rate and invoiced amount per group.
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
                $totals_by_key[$key] = ['name' => $tax_line->name, 'rate' => $tax_line->rate, 'amount' => 0];
            }

            $totals_by_key[$key]['amount'] += $tax_line->invoiced_amount;
        }

        $breakdown = [];

        foreach ($totals_by_key as $entry) {
            $breakdown[] = [
                'name' => $entry['name'],
                'rate' => $entry['rate'],
                'invoiced_amount_money_object' => Money::prepare_amount_object_from_minor($entry['amount'], $this->currency_code),
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

    /**
     * Resolve the payment action the shopper still has to take, if any.
     *
     * Payment::pay() opens a live session with the gateway, so it must only run
     * for an order that is still awaiting payment - this resource also renders
     * historical orders in the account area.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO|null Null when the order is already settled or the gateway returns no action.
     */
    protected function resolve_payment_next_step()
    {
        $settled_statuses = [PaymentStatus::PAID, PaymentStatus::REFUNDING, PaymentStatus::REFUNDED];

        if (in_array($this->payment_status, $settled_statuses, true)) {
            return null;
        }

        if ($this->base_total <= 0) {
            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => Url::get_checkout_success_url($this->uuid),
            ]);
        }

        try {
            $payment_action = Payment::pay($this->resource);

            if ($payment_action instanceof PaymentActionDTO) {
                return $payment_action;
            }
        } catch (Exception $e) {
            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => Url::get_checkout_success_url($this->uuid),
            ]);
        }

        return;
    }
}
