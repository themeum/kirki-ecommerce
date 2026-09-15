<?php

namespace Kirki\Ecommerce\App\Resources\Cart;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
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

        $this->base_tax_total = $result->base_tax_total;
        $this->base_shipping_subtotal = $result->base_shipping_subtotal;
        $this->base_shipping_discount = $result->base_shipping_discount;
        $this->base_total = $result->base_total;
        $this->items_count = $result->items_count;

        $shipping_service = app()->make(ShippingService::class);
        $shipping_options = $shipping_service->get_final_available_shipping_options($context);

        $display_currency = Money::resolve_display_currency();

        $items_subtotal = $this->get_items_subtotal($result->items, $result->coupon_results);
        $order_discount = $this->get_order_coupon_discount($result->coupon_results);
        $shipping_amount = $this->base_shipping_subtotal - $this->base_shipping_discount;

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
                'display_items_subtotal_money_object' => Money::prepare_amount_object_from_minor($items_subtotal, $this->base_currency_code, $display_currency),
                'display_order_discount_money_object' => Money::prepare_amount_object_from_minor($order_discount, $this->base_currency_code, $display_currency),
                'display_order_total_money_object' => Money::prepare_amount_object_from_minor($items_subtotal - $order_discount, $this->base_currency_code, $display_currency),
                'display_tax_total_money_object' => Money::prepare_amount_object_from_minor($this->base_tax_total, $this->base_currency_code, $display_currency),
                'coupons' => $this->format_coupon_results($result->coupon_results, $this->base_currency_code, $display_currency),
                'display_shipping_amount_money_object' => Money::prepare_amount_object_from_minor($shipping_amount, $this->base_currency_code, $display_currency),
                'display_total_money_object' => Money::prepare_amount_object_from_minor($this->base_total, $this->base_currency_code, $display_currency),
                'tax_lines' => $this->format_tax_breakdown(
                    array_merge($this->flatten_item_tax_lines($result), $result->shipping_tax_lines),
                    $this->base_currency_code,
                    $display_currency
                ),
            ],

            'items_count' => $this->items_count,
            'items' => $this->prepare_items($this->items, $result, $display_currency),

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

    protected function prepare_items($items, $result, $display_currency)
    {
        $cart_items = [];

        foreach ($items as $item) {
            if (isset($result->items[$item->variant_id])) {
                $calculated_item = $result->items[$item->variant_id];
                $product_coupon_discount = $this->get_product_coupon_discount_for_item($result->coupon_results, $item->variant_id);

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
                        'track_inventory'     => (bool) $item->variant->track_inventory,
                        'allow_back_order'    => (bool) $item->variant->allow_back_order,
                        'has_limit_per_order' => (bool) $item->variant->has_limit_per_order,
                        'max_per_order'       => $item->variant->has_limit_per_order ? (int) $item->variant->max_per_order : null,
                    ],
                    'display_subtotal_money_object' => Money::prepare_amount_object_from_minor($calculated_item->base_subtotal - $product_coupon_discount, $this->base_currency_code, $display_currency),
                    'display_strikethrough_price_money_object' => $this->prepare_strikethrough_price($calculated_item, $product_coupon_discount, $this->base_currency_code, $display_currency),
                    'applied_product_coupons' => $this->get_applied_product_coupons_for_item($result->coupon_results, $item->variant_id, $this->base_currency_code, $display_currency),
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
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
     * Sum every item's own subtotal, net of only that item's product-scoped
     * coupon - an order-wide coupon's allocation is excluded so the root
     * items subtotal matches the sum of what each item's own display
     * subtotal shows.
     *
     * @param \Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO[] $calculated_items Keyed by variant_id
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results
     * @return int
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
     * @param \Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO[] $coupon_results
     * @return int
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
