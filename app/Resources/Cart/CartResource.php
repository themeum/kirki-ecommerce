<?php

namespace Kirki\Ecommerce\App\Resources\Cart;

use Brick\Math\RoundingMode;
use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Supports\Tax;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\Framework\app;

/**
 * API resource for the shopper's cart, recalculated with totals, tax lines, coupons and shipping options.
 *
 * @since 1.0.0
 */
class CartResource extends Resource
{
    /**
     * Whether the cart recalculation includes tax.
     *
     * @var bool
     */
    protected $should_calculate_tax;

    /**
     * Create the resource for a cart.
     *
     * @since 1.0.0
     *
     * @param object|array $resource             Cart to transform.
     * @param bool         $should_calculate_tax Whether to include tax when recalculating the cart.
     */
    public function __construct($resource, bool $should_calculate_tax = true)
    {
        parent::__construct($resource);

        $this->should_calculate_tax = $should_calculate_tax;
    }

    /**
     * Convert the cart resource to an array.
     *
     * Recalculates the cart first, so totals reflect current prices, coupons, shipping and tax.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The cart data, or an empty array when there is no cart.
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

        $this->base_tax_total = $result->base_tax_total;
        $this->base_shipping_subtotal = $result->base_shipping_subtotal;
        $this->base_shipping_discount = $result->base_shipping_discount;
        $this->base_total = $result->base_total;
        $this->items_count = $result->items_count;

        $shipping_service = app()->make(ShippingService::class);
        $shipping_options = $shipping_service->get_final_available_shipping_options($context);

        $display_currency = Money::resolve_display_currency();
        $is_inclusive_tax = Tax::is_tax_inclusive();

        $items_subtotal = $this->get_items_subtotal($result->items, $result->coupon_results);
        $items_tax_total = $this->get_items_tax_total($result->items);
        $order_discount = $this->get_order_coupon_discount($result->coupon_results);
        $shipping_amount = $this->base_shipping_subtotal - $this->base_shipping_discount;

        // Every item's own base_subtotal is always net of tax as of this fix
        // (item-pricing-tax-exclusivity); CartResource's output must not
        // change, so under tax-inclusive pricing the items-only tax is
        // added back to reconstruct the same figure this rendered before -
        // exact, since both are computed against the same (post-discount)
        // taxable base.
        $items_subtotal_display = $is_inclusive_tax ? $items_subtotal + $items_tax_total : $items_subtotal;

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'cart_token' => $this->cart_token,

            'currency' => [
                'code' => $this->currency_code,
                'base_code' => $this->base_currency_code,
                'display_code' => $display_currency,
            ],

            'pricing' => [
                'display_items_subtotal_money_object' => Money::prepare_amount_object_from_minor($items_subtotal_display, $this->base_currency_code, $display_currency),
                'display_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount, $this->base_currency_code, $display_currency),
                'display_order_total_money_object' => Money::prepare_amount_object_from_minor($items_subtotal_display - $order_discount, $this->base_currency_code, $display_currency),
                'display_tax_total_money_object' => Money::prepare_amount_object_from_minor($this->base_tax_total, $this->base_currency_code, $display_currency),
                'coupons' => $this->format_coupon_results($result->coupon_results, $this->base_currency_code, $display_currency),
                'display_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($shipping_amount, $this->base_currency_code, $display_currency),
                'display_shipping_strikethrough_money_object' => Money::prepare_amount_object_from_minor($this->base_shipping_subtotal, $this->base_currency_code, $display_currency),
                'display_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total, $this->base_currency_code, $display_currency),
                'tax_lines' => $this->format_tax_breakdown(
                    array_merge($this->flatten_item_tax_lines($result), $result->shipping_tax_lines),
                    $this->base_currency_code,
                    $display_currency
                ),
            ],

            'items_count' => $this->items_count,
            'items' => $this->prepare_items($this->items, $result, $display_currency, $is_inclusive_tax),

            'shipping_address' => $this->shipping_address,
            'billing_address' => $this->billing_address,
            'is_billing_same_as_shipping' => $this->is_billing_same_as_shipping,

            'available_shipping_methods' => array_map(function ($method) use ($display_currency) {
                $cost = $method['base_cost'];
                unset($method['base_cost']);
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

    /**
     * Build the cart line items with product details, net subtotals and applied product coupons.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\CartItem[]                    $items            Items of the cart.
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO $result           Calculation result holding the per-variant totals.
     * @param string                                                    $display_currency Currency code the amounts are converted to.
     * @param bool                                                      $is_inclusive_tax Whether the store prices items inclusive of tax.
     * @return array<int, array<string, mixed>> Line item data, skipping items missing from the calculation result.
     */
    protected function prepare_items($items, $result, $display_currency, $is_inclusive_tax)
    {
        $cart_items = [];

        foreach ($items as $item) {
            if (isset($result->items[$item->variant_id])) {
                $calculated_item = $result->items[$item->variant_id];
                $product_coupon_discount = $this->get_product_coupon_discount_for_item($result->coupon_results, $item->variant_id);

                // Every calculated item's base_subtotal is always net of tax
                // as of this fix; under tax-inclusive pricing, add the
                // item's own tax back to reconstruct the same figure this
                // rendered before (exact - same base as base_tax_amount).
                $subtotal_exclusive = $calculated_item->base_subtotal - $product_coupon_discount;
                $subtotal_display = $is_inclusive_tax ? $subtotal_exclusive + $calculated_item->base_tax_amount : $subtotal_exclusive;

                $cart_items[] = [
                    'id' => $item->id,
                    'cart_id' => $item->cart_id,
                    'quantity' => $item->quantity,
                    'product' => [
                        'id' => $item->product->id,
                        'variant_id' => $item->variant->id,
                        'title' => $item->product->title,
                        'slug' => $item->product->slug,
                        'display_price_money_object' => Money::prepare_amount_object_from_minor($item->variant->base_price, $this->base_currency_code, $display_currency),
                        'display_sale_price_money_object' => !is_null($item->variant->base_sale_price) ? Money::prepare_amount_object_from_minor($item->variant->base_sale_price, $this->base_currency_code, $display_currency) : null,
                        'media' => !empty($item->variant->media) ? MediaAttachment::make($item->variant->media) : MediaAttachment::make($item->product->media->first()->ID ?? null) ?? null,
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
                        'available_quantity'  => $item->variant->available_quantity,
                        'in_stock'            => $item->variant->in_stock,
                        'is_available'        => $item->variant->is_available(),
                        'track_inventory'     => (bool) $item->variant->track_inventory,
                        'allow_back_order'    => (bool) $item->variant->allow_back_order,
                        'has_limit_per_order' => (bool) $item->variant->has_limit_per_order,
                        'max_per_order'       => $item->variant->has_limit_per_order ? (int) $item->variant->max_per_order : null,
                    ],
                    'display_subtotal_money_object' => Money::prepare_amount_object_from_minor($subtotal_display, $this->base_currency_code, $display_currency),
                    'display_strikethrough_price_money_object' => $this->prepare_strikethrough_price($calculated_item, $product_coupon_discount, $subtotal_exclusive, $is_inclusive_tax, $this->base_currency_code, $display_currency),
                    'applied_product_coupons' => $this->get_applied_product_coupons_for_item($result->coupon_results, $item->variant_id, $this->base_currency_code, $display_currency),
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
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
     * @param string                                                      $base_currency_code Currency code of the cart amounts.
     * @param string                                                      $display_currency   Currency code the amounts are converted to.
     * @return array<int, array<string, mixed>> Coupon details and display discount amounts.
     */
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
                'display_discount_amount_fixed_money_object' => !empty($coupon->base_discount_amount_fixed) ? Money::prepare_amount_object_from_minor($coupon->base_discount_amount_fixed, $base_currency_code, $display_currency) : null,
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
     * items subtotal matches the sum of what each item's own display
     * subtotal shows.
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
     * Sum every calculated item's own tax - used to reconstruct the
     * pre-fix root subtotal figure under tax-inclusive pricing (see
     * to_array()). Deliberately not `CalculationResultDTO::$base_tax_total`,
     * which also includes shipping tax and would overstate the reconstructed
     * items subtotal.
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
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results     Coupon results from the calculation.
     * @param int                                                         $variant_id         Variant ID of the item.
     * @param string                                                      $base_currency_code Currency code of the cart amounts.
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

            $applied[] = [
                'code' => $coupon->code,
                'title' => $coupon->title,
                'discount_value_type' => $coupon->discount_value_type,
                'discount_amount_percentage' => $coupon->discount_amount_percentage,
                'base_discount_amount_fixed' => $coupon->base_discount_amount_fixed,
                'display_discount_amount_fixed_money_object' => !empty($coupon->base_discount_amount_fixed) ? Money::prepare_amount_object_from_minor($coupon->base_discount_amount_fixed, $base_currency_code, $display_currency) : null,
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
     * @param string                                    $base_currency_code Currency code of the cart amounts.
     * @param string                                    $display_currency   Currency code the amounts are converted to.
     * @return array<int, array<string, mixed>> Tax name, rate and display amount per group.
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
     * Both the coupon-applied and sale-only figures are always net of tax
     * as of this fix; under tax-inclusive pricing they're scaled back up by
     * the item's effective tax rate (not a flat tax-total addition - the
     * strikethrough base differs from the item's taxed base) to reconstruct
     * the same figure this rendered before - see derive_inclusive_amount_at_rate().
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO $calculated_item         Calculated line item.
     * @param int                                                     $product_coupon_discount Discount from item-scoped coupons, in minor units.
     * @param int                                                     $subtotal_exclusive      The item's current-price exclusive subtotal, in minor units.
     * @param bool                                                    $is_inclusive_tax        Whether the store prices items inclusive of tax.
     * @param string                                                  $base_currency_code      Currency code of the cart amounts.
     * @param string                                                  $display_currency        Currency code the amounts are converted to.
     * @return \Kirki\Ecommerce\App\DTO\MoneyDTO|null Null when nothing should be struck through.
     */
    protected function prepare_strikethrough_price($calculated_item, $product_coupon_discount, $subtotal_exclusive, $is_inclusive_tax, $base_currency_code, $display_currency)
    {
        if ($product_coupon_discount > 0) {
            $strikethrough_amount = $calculated_item->base_subtotal;
        } elseif ($calculated_item->base_subtotal < $calculated_item->base_product_total) {
            $strikethrough_amount = $calculated_item->base_product_total;
        } else {
            return null;
        }

        if ($is_inclusive_tax) {
            $strikethrough_amount = $this->derive_inclusive_amount_at_rate($strikethrough_amount, $subtotal_exclusive, $calculated_item->base_tax_amount);
        }

        return Money::prepare_amount_object_from_minor($strikethrough_amount, $base_currency_code, $display_currency);
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
