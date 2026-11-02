<?php

namespace Kirki\Ecommerce\App\Resources\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Concerns\FormatsShippingOptions;
use Kirki\Ecommerce\App\Concerns\FormatsVariantStock;

/**
 * API resource for an order opened for an edit (admin).
 *
 * It is the full order, plus what the edit screen needs before the first preview:
 * whether each line is reachable, its variant's current stock and per-order limit
 * values, and the shipping methods that can be chosen. Those values are read when
 * the response is built, not from the order.
 *
 * @since 1.0.0
 */
class OrderEditResource extends OrderResource
{
    use FormatsShippingOptions;
    use FormatsVariantStock;

    /** @var array<int, array<string, mixed>> */
    protected $shipping_options;

    /**
     * Create the resource.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\Order $order            Order with its items and their variants and products loaded.
     * @param array<int, array<string, mixed>>  $shipping_options Shipping options with a `base_cost` in minor units.
     */
    public function __construct($order, array $shipping_options)
    {
        parent::__construct($order);

        $this->shipping_options = $shipping_options;
    }

    /**
     * Convert the order to an array, with the shipping methods that can be chosen.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The order data.
     */
    public function to_array()
    {
        return array_merge(parent::to_array(), [
            'available_shipping_methods' => $this->format_shipping_options($this->shipping_options),
        ]);
    }

    /**
     * Build the admin-facing line items, each with its reachability and its variant's current stock values.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Models\OrderItem[]   $items         Items of the order.
     * @param \Kirki\Ecommerce\App\Models\OrderCoupon[] $order_coupons Coupons applied to the order.
     * @return array<int, array<string, mixed>> Line item data.
     */
    protected function prepare_items($items, $order_coupons)
    {
        return array_map(function ($order_item, $item) {
            $variant = $item->variant;

            return array_merge(
                $order_item,
                ['is_reachable' => $variant !== null && $variant->is_available()],
                $this->format_variant_stock_fields($variant)
            );
        }, parent::prepare_items($items, $order_coupons), $items->all());
    }
}
