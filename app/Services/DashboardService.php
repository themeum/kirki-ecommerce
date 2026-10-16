<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Resources\Order\OrderListResource;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\Framework\app;

defined('ABSPATH') || exit;

/**
 * Builds the store overview shown on the Home page once setup is complete.
 *
 * Sales figures cover all time and only count orders that were paid at some
 * point: those whose payment status is paid, refunding or refunded.
 *
 * @since 1.0.0
 */
class DashboardService
{
    const LIST_LIMIT = 5;

    /**
     * Get the overview metrics, the most recent orders and the top selling products.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function get_overview()
    {
        return [
            'metrics' => $this->get_metrics(),
            'recent_orders' => $this->get_recent_orders(),
            'top_products' => $this->get_top_products(),
        ];
    }

    /**
     * Get the payment statuses of orders that count toward sales.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    public static function get_counted_payment_statuses()
    {
        return [PaymentStatus::PAID, PaymentStatus::REFUNDING, PaymentStatus::REFUNDED];
    }

    /**
     * Get the all-time sales metrics of counted orders, in the base currency.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function get_metrics()
    {
        $totals = $this->counted_orders()
            ->select_raw(
                'COUNT(*) AS orders_count, '
                    . 'COALESCE(SUM(base_total), 0) AS base_total, '
                    . 'COALESCE(SUM(base_tax_total), 0) AS base_tax_total, '
                    . 'COALESCE(SUM(base_shipping_total), 0) AS base_shipping_total'
            )
            ->first();

        $products_sold = OrderItem::query()
            ->where_in('order_id', $this->counted_order_ids())
            ->select_raw('COALESCE(SUM(quantity), 0) AS products_sold')
            ->first();

        $base_total_sales = (int) ($totals->base_total ?? 0);
        $base_net_sales = $base_total_sales
            - (int) ($totals->base_tax_total ?? 0)
            - (int) ($totals->base_shipping_total ?? 0)
            - $this->get_base_refunded_total();

        return [
            'base_total_sales' => Money::prepare_amount_from_minor($base_total_sales),
            'base_total_sales_money_object' => Money::prepare_amount_object_from_minor($base_total_sales),
            'base_net_sales' => Money::prepare_amount_from_minor($base_net_sales),
            'base_net_sales_money_object' => Money::prepare_amount_object_from_minor($base_net_sales),
            'orders_count' => (int) ($totals->orders_count ?? 0),
            'products_sold' => (int) ($products_sold->products_sold ?? 0),
        ];
    }

    /**
     * Get the completed refunds of counted orders, converted to the base currency.
     *
     * Refunds are stored only in the order currency, so each order's refunded
     * amount is scaled by that order's own base-to-invoiced total ratio.
     *
     * @since 1.0.0
     *
     * @return int Amount in minor units of the base currency.
     */
    protected function get_base_refunded_total()
    {
        $refunded_by_order = Refund::query()
            ->where('status', RefundStatus::COMPLETED)
            ->where_in('order_id', $this->counted_order_ids())
            ->select_raw('order_id, SUM(invoiced_amount) AS invoiced_refunded')
            ->group_by('order_id')
            ->get()
            ->pluck('invoiced_refunded', 'order_id')
            ->all();

        if (empty($refunded_by_order)) {
            return 0;
        }

        $orders = Order::query()
            ->where_in('id', array_keys($refunded_by_order))
            ->where('invoiced_total', '>', 0)
            ->get(['id', 'base_total', 'invoiced_total']);

        $base_refunded = 0;

        foreach ($orders as $order) {
            $base_refunded += (int) round(
                $refunded_by_order[$order->id] * $order->base_total / $order->invoiced_total
            );
        }

        return $base_refunded;
    }

    /**
     * Get the most recently created orders, of any status.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function get_recent_orders()
    {
        $orders = Order::query()
            ->order_by('created_at', 'desc')
            ->order_by('id', 'desc')
            ->limit(static::LIST_LIMIT)
            ->get();

        return OrderListResource::collection($orders);
    }

    /**
     * Get the products that sold the most units in counted orders.
     *
     * Variants are merged into their product. Items whose product is gone have
     * no product ID, so they are grouped by their recorded name instead. Name and
     * image come from each product's newest order item, so a deleted product
     * still shows. Stock covers all of the product's current variants, the same
     * as the product list, and is null for a deleted product.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function get_top_products()
    {
        $rows = OrderItem::query()
            ->where_in('order_id', $this->counted_order_ids())
            ->select_raw(
                'MAX(product_id) AS product_id, MAX(id) AS latest_item_id, '
                    . 'SUM(quantity) AS units_sold, SUM(base_total) AS base_revenue'
            )
            ->group_by_raw("CASE WHEN product_id IS NULL THEN CONCAT('name:', product_name) ELSE product_id END")
            ->order_by_raw('units_sold DESC, base_revenue DESC')
            ->limit(static::LIST_LIMIT)
            ->get();

        if ($rows->is_empty()) {
            return [];
        }

        $latest_items = OrderItem::query()
            ->where_in('id', $rows->pluck('latest_item_id')->all())
            ->get(['id', 'product_name', 'product_image'])
            ->key_by('id')
            ->all();

        $products = Product::query()
            ->with(['variants'])
            ->where_in('id', $rows->pluck('product_id')->filter()->values()->all())
            ->get()
            ->key_by('id')
            ->all();

        return $rows->map(function ($row) use ($latest_items, $products) {
            $item = $latest_items[$row->latest_item_id] ?? null;
            $base_revenue = (int) $row->base_revenue;
            $product = $row->product_id === null ? null : ($products[$row->product_id] ?? null);

            return array_merge([
                'product_id' => $row->product_id === null ? null : (int) $row->product_id,
                'product_name' => $item->product_name ?? null,
                'image' => MediaAttachment::make($item->product_image ?? null),
                'units_sold' => (int) $row->units_sold,
                'base_revenue' => Money::prepare_amount_from_minor($base_revenue),
                'base_revenue_money_object' => Money::prepare_amount_object_from_minor($base_revenue),
            ], $this->get_product_stock($product));
        })->values()->all();
    }

    /**
     * Get the stock summary of a product across its variants.
     *
     * The inventory is the summed available quantity of the variants that track
     * inventory, the same as in the product list.
     *
     * @since 1.0.0
     *
     * @param Product|null $product Product with its variants loaded, or null when it was deleted.
     *
     * @return array<string, mixed>
     */
    protected function get_product_stock($product)
    {
        if ($product === null || $product->variants->is_empty()) {
            return [
                'availability_status' => null,
                'track_inventory' => false,
                'inventory' => 0,
            ];
        }

        $variants = $product->variants->all();
        $track_inventory = false;
        $inventory = 0;

        foreach ($variants as $variant) {
            if ($variant->track_inventory) {
                $track_inventory = true;
                $inventory += (int) $variant->available_quantity;
            }
        }

        $store_default_threshold = (int) Settings::get('product.low_stock_threshold', 0);

        return [
            'availability_status' => app()->make(AvailabilityService::class)->resolve_product_status($variants, $store_default_threshold),
            'track_inventory' => $track_inventory,
            'inventory' => $inventory,
        ];
    }

    /**
     * Start a query on the orders that count toward sales.
     *
     * @since 1.0.0
     *
     * @return QueryBuilder
     */
    protected function counted_orders()
    {
        return Order::query()->where_in('payment_status', static::get_counted_payment_statuses());
    }

    /**
     * Get a subquery that selects the IDs of the orders that count toward sales.
     *
     * @since 1.0.0
     *
     * @return QueryBuilder
     */
    protected function counted_order_ids()
    {
        return $this->counted_orders()->select('id');
    }
}
