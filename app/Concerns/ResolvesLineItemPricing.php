<?php

namespace Kirki\Ecommerce\App\Concerns;

defined('ABSPATH') || exit;

/**
 * Resolves a line item's display prices from its catalog figures.
 *
 * Every figure is on the catalog basis, so it includes tax exactly when the
 * item was priced inclusive of tax. No tax is added or removed here.
 *
 * A line item's "was" (strikethrough) price is the baseline before whichever
 * discount reduces its subtotal: a product-scoped coupon strikes through the
 * sale-price total; otherwise a sale strikes through the regular-price total.
 * An order-wide coupon never causes a strikethrough price.
 *
 * @since 1.0.0
 */
trait ResolvesLineItemPricing
{
    /**
     * Get a calculated line item's strikethrough amount.
     *
     * @since 1.0.0
     *
     * @param int $catalog_regular_price      Unit regular price, as in the catalog.
     * @param int $catalog_sale_price         Unit price sold at, as in the catalog.
     * @param int $coupon_discounted_subtotal Line total after product-scoped coupons only.
     * @param int $quantity                   The item's quantity.
     * @return int|null Strikethrough line amount, or null when nothing should be struck through.
     */
    protected function get_strikethrough_amount($catalog_regular_price, $catalog_sale_price, $coupon_discounted_subtotal, $quantity)
    {
        if ($this->is_reduced_by_product_coupon($catalog_sale_price, $coupon_discounted_subtotal, $quantity)) {
            return $catalog_sale_price * $quantity;
        }

        if ($this->is_on_sale($catalog_regular_price, $catalog_sale_price)) {
            return $catalog_regular_price * $quantity;
        }

        return null;
    }

    /**
     * Get a stored order item's strikethrough amounts in both currencies.
     *
     * Which baseline applies is decided from the base figures only, so
     * currency conversion rounding can never make an item look discounted.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem $item Order item to price.
     * @return array{invoiced: int|null, base: int|null} Both null when nothing should be struck through.
     */
    protected function get_order_item_strikethrough_amounts($item)
    {
        if ($this->is_reduced_by_product_coupon($item->base_catalog_sale_price, $item->base_catalog_product_coupon_discounted_subtotal, $item->quantity)) {
            return [
                'invoiced' => $item->invoiced_catalog_sale_price * $item->quantity,
                'base' => $item->base_catalog_sale_price * $item->quantity,
            ];
        }

        if ($this->is_on_sale($item->base_catalog_regular_price, $item->base_catalog_sale_price)) {
            return [
                'invoiced' => $item->invoiced_catalog_regular_price * $item->quantity,
                'base' => $item->base_catalog_regular_price * $item->quantity,
            ];
        }

        return ['invoiced' => null, 'base' => null];
    }

    /**
     * Check whether product-scoped coupons reduced a line item below its sale-price total.
     *
     * @since 1.0.0
     *
     * @param int $catalog_sale_price         Unit price sold at, as in the catalog.
     * @param int $coupon_discounted_subtotal Line total after product-scoped coupons only.
     * @param int $quantity                   The item's quantity.
     * @return bool
     */
    protected function is_reduced_by_product_coupon($catalog_sale_price, $coupon_discounted_subtotal, $quantity)
    {
        return $coupon_discounted_subtotal < $catalog_sale_price * $quantity;
    }

    /**
     * Check whether a line item was sold below its regular price.
     *
     * @since 1.0.0
     *
     * @param int $catalog_regular_price Unit regular price, as in the catalog.
     * @param int $catalog_sale_price    Unit price sold at, as in the catalog.
     * @return bool
     */
    protected function is_on_sale($catalog_regular_price, $catalog_sale_price)
    {
        return $catalog_regular_price > $catalog_sale_price;
    }

    /**
     * Get the per-unit amount of a line amount - divided by the quantity and
     * rounded up to the currency's minor unit, so unit × quantity may exceed
     * the line amount by up to quantity − 1 minor units. The line amount
     * stays authoritative.
     *
     * @since 1.0.0
     *
     * @param int|null $line_amount Line amount, in minor units, or null when there is none.
     * @param int      $quantity    The item's quantity.
     * @return int|null Unit amount in minor units; null when the line amount is null.
     */
    protected function get_unit_amount($line_amount, $quantity)
    {
        if ($line_amount === null) {
            return null;
        }

        $quantity = max(1, (int) $quantity);

        return intdiv($line_amount + $quantity - 1, $quantity);
    }
}
