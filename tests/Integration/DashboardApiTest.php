<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class DashboardApiTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Start every test from a store with no orders and a USD base currency.
     *
     * Plugin table state carries across tests in a class, so orders and their
     * children are removed here. Money formatting needs a base currency row.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        Refund::query()->delete();
        OrderItem::query()->delete();
        Order::query()->delete();

        if (!Currency::query()->where('is_base', true)->exists()) {
            Currency::create(['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1, 'is_base' => true, 'is_active' => true]);
        }
    }

    /**
     * A store with no orders has zero metrics and empty lists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_empty_store_has_zero_metrics_and_empty_lists(): void
    {
        $overview = $this->get_overview();

        $this->assertSame(0, $this->minor($overview['metrics']['base_total_sales_money_object']));
        $this->assertSame(0, $this->minor($overview['metrics']['base_net_sales_money_object']));
        $this->assertSame(0, $overview['metrics']['orders_count']);
        $this->assertSame(0, $overview['metrics']['products_sold']);
        $this->assertSame([], $overview['recent_orders']);
        $this->assertSame([], $overview['top_products']);
    }

    /**
     * Unpaid, failed and cancelled orders are not counted; paid, refunding and refunded orders are.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_only_orders_paid_at_some_point_are_counted(): void
    {
        foreach ([PaymentStatus::UNPAID, PaymentStatus::FAILED, PaymentStatus::CANCELLED, PaymentStatus::PENDING] as $status) {
            $this->create_order(['payment_status' => $status, 'base_total' => 5000], [['quantity' => 4]]);
        }

        foreach ([PaymentStatus::PAID, PaymentStatus::REFUNDING, PaymentStatus::REFUNDED] as $status) {
            $this->create_order(['payment_status' => $status, 'base_total' => 1000], [['quantity' => 1]]);
        }

        $metrics = $this->get_overview()['metrics'];

        $this->assertSame(3000, $this->minor($metrics['base_total_sales_money_object']));
        $this->assertSame(3, $metrics['orders_count']);
        $this->assertSame(3, $metrics['products_sold']);
    }

    /**
     * Net sales removes tax, shipping and completed refunds, but not pending or cancelled refunds.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_net_sales_removes_tax_shipping_and_completed_refunds(): void
    {
        $order = $this->create_order([
            'base_total' => 12000,
            'invoiced_total' => 12000,
            'base_tax_total' => 1000,
            'base_shipping_total' => 1000,
        ], [['quantity' => 2]]);

        $this->create_refund($order, 2000, RefundStatus::COMPLETED);
        $this->create_refund($order, 500, RefundStatus::PENDING);
        $this->create_refund($order, 700, RefundStatus::CANCELLED);

        $metrics = $this->get_overview()['metrics'];

        $this->assertSame(12000, $this->minor($metrics['base_total_sales_money_object']));
        $this->assertSame(8000, $this->minor($metrics['base_net_sales_money_object']));
        $this->assertSame(1, $metrics['orders_count']);
        $this->assertSame(2, $metrics['products_sold']);
    }

    /**
     * Net sales takes the shipping tax off once, because the tax total and the shipping total both hold it.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_net_sales_does_not_remove_shipping_tax_twice(): void
    {
        $this->create_order([
            'base_total' => 12000,
            'invoiced_total' => 12000,
            'base_tax_total' => 1000,
            'base_shipping_total' => 1000,
            'base_shipping_tax_amount' => 200,
        ], [['quantity' => 1]]);

        $metrics = $this->get_overview()['metrics'];

        $this->assertSame(10200, $this->minor($metrics['base_net_sales_money_object']));
    }

    /**
     * A refund in another currency is converted with its own order's base-to-invoiced ratio.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_refund_in_another_currency_uses_the_order_ratio(): void
    {
        $order = $this->create_order([
            'currency_code' => 'EUR',
            'base_total' => 10000,
            'invoiced_total' => 20000,
        ], [['quantity' => 1]]);

        $this->create_refund($order, 4000, RefundStatus::COMPLETED);

        $metrics = $this->get_overview()['metrics'];

        $this->assertSame(10000, $this->minor($metrics['base_total_sales_money_object']));
        $this->assertSame(8000, $this->minor($metrics['base_net_sales_money_object']));
    }

    /**
     * A completed refund on an order that is not counted does not change net sales.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_refund_on_uncounted_order_is_ignored(): void
    {
        $this->create_order(['base_total' => 1000, 'invoiced_total' => 1000], [['quantity' => 1]]);
        $unpaid = $this->create_order(['payment_status' => PaymentStatus::UNPAID, 'base_total' => 1000, 'invoiced_total' => 1000]);
        $this->create_refund($unpaid, 500, RefundStatus::COMPLETED);

        $metrics = $this->get_overview()['metrics'];

        $this->assertSame(1000, $this->minor($metrics['base_net_sales_money_object']));
    }

    /**
     * Variants of one product are merged into a single top product row.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_top_products_merge_variants(): void
    {
        $product_id = $this->create_product()['id'];

        $this->create_order([], [
            ['product_id' => $product_id, 'variant_name' => 'Red', 'product_name' => 'T-shirt', 'quantity' => 3, 'base_total' => 3000],
            ['product_id' => $product_id, 'variant_name' => 'Blue', 'product_name' => 'T-shirt', 'quantity' => 2, 'base_total' => 2000],
        ]);

        $top_products = $this->get_overview()['top_products'];

        $this->assertCount(1, $top_products);
        $this->assertSame($product_id, $top_products[0]['product_id']);
        $this->assertSame('T-shirt', $top_products[0]['product_name']);
        $this->assertSame(5, $top_products[0]['units_sold']);
        $this->assertSame(5000, $this->minor($top_products[0]['base_revenue_money_object']));
    }

    /**
     * Top products are ranked by units, then by revenue, and limited to five.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_top_products_rank_by_units_then_revenue(): void
    {
        $ids = [];

        for ($index = 1; $index <= 6; $index++) {
            $ids[$index] = $this->create_product()['id'];
        }

        $this->create_order([], [
            ['product_id' => $ids[1], 'product_name' => 'Cheap', 'quantity' => 4, 'base_total' => 400],
            ['product_id' => $ids[2], 'product_name' => 'Expensive', 'quantity' => 4, 'base_total' => 4000],
            ['product_id' => $ids[3], 'product_name' => 'Best seller', 'quantity' => 9, 'base_total' => 900],
            ['product_id' => $ids[4], 'product_name' => 'Fourth', 'quantity' => 2, 'base_total' => 200],
            ['product_id' => $ids[5], 'product_name' => 'Fifth', 'quantity' => 1, 'base_total' => 500],
            ['product_id' => $ids[6], 'product_name' => 'Sixth', 'quantity' => 1, 'base_total' => 100],
        ]);
        $this->create_order(['payment_status' => PaymentStatus::UNPAID], [
            ['product_id' => $ids[6], 'product_name' => 'Sixth', 'quantity' => 50, 'base_total' => 5000],
        ]);

        $names = array_column($this->get_overview()['top_products'], 'product_name');

        $this->assertSame(['Best seller', 'Expensive', 'Cheap', 'Fourth', 'Fifth'], $names);
    }

    /**
     * Items of a deleted product are still listed, by the name recorded on the newest item.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_deleted_product_is_listed_by_its_recorded_name(): void
    {
        $this->create_order([], [
            ['product_id' => null, 'product_name' => 'Retired mug', 'quantity' => 2, 'base_total' => 1000],
            ['product_id' => null, 'product_name' => 'Retired cap', 'quantity' => 1, 'base_total' => 500],
        ]);

        $top_products = $this->get_overview()['top_products'];

        $this->assertSame(['Retired mug', 'Retired cap'], array_column($top_products, 'product_name'));
        $this->assertNull($top_products[0]['product_id']);
    }

    /**
     * A product that tracks inventory reports the summed quantity of its tracked variants.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_top_product_reports_tracked_inventory(): void
    {
        $product_id = $this->create_product([
            'variants' => [$this->variant_payload(['track_inventory' => true, 'available_quantity' => 40, 'is_default' => true])],
        ])['id'];

        foreach ([['track_inventory' => true, 'available_quantity' => 19], ['track_inventory' => false, 'available_quantity' => 500]] as $variant) {
            Variant::create(array_merge($this->variant_payload(['product_id' => $product_id, 'base_price' => 1000]), $variant));
        }

        $this->create_order([], [['product_id' => $product_id, 'quantity' => 1]]);

        $top_product = $this->get_overview()['top_products'][0];

        $this->assertTrue($top_product['track_inventory']);
        $this->assertSame(59, $top_product['inventory']);
        $this->assertSame('in_stock', $top_product['availability_status']);
    }

    /**
     * A product that does not track inventory reports only whether it is in stock.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_top_product_without_tracking_reports_stock_status(): void
    {
        $product_id = $this->create_product([
            'variants' => [$this->variant_payload(['in_stock' => false, 'is_default' => true])],
        ])['id'];

        $this->create_order([], [['product_id' => $product_id, 'quantity' => 1]]);

        $top_product = $this->get_overview()['top_products'][0];

        $this->assertFalse($top_product['track_inventory']);
        $this->assertSame(0, $top_product['inventory']);
        $this->assertSame('out_of_stock', $top_product['availability_status']);
    }

    /**
     * A deleted product has no stock status.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_deleted_product_has_no_stock_status(): void
    {
        $this->create_order([], [['product_id' => null, 'product_name' => 'Retired mug', 'quantity' => 1]]);

        $top_product = $this->get_overview()['top_products'][0];

        $this->assertNull($top_product['availability_status']);
        $this->assertFalse($top_product['track_inventory']);
    }

    /**
     * Recent orders include every payment status, newest first, limited to five.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_recent_orders_list_the_five_newest_of_any_status(): void
    {
        for ($day = 1; $day <= 6; $day++) {
            $this->create_order([
                'order_number' => 'ORD-' . $day,
                'payment_status' => $day === 6 ? PaymentStatus::UNPAID : PaymentStatus::PAID,
            ], [], sprintf('2026-01-%02d 10:00:00', $day));
        }

        $recent_orders = $this->get_overview()['recent_orders'];

        $this->assertSame(['ORD-6', 'ORD-5', 'ORD-4', 'ORD-3', 'ORD-2'], array_column($recent_orders, 'order_number'));
        $this->assertSame(PaymentStatus::UNPAID, $recent_orders[0]['payment_status']);
    }

    /**
     * Metric and top product money objects have a short display; recent orders do not.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_metrics_and_top_products_have_short_display(): void
    {
        $this->create_order(['base_total' => 2034500, 'invoiced_total' => 2034500], [
            ['product_name' => 'Sofa', 'quantity' => 1, 'base_total' => 2034500],
        ]);

        $overview = $this->get_overview();
        $total_sales = $overview['metrics']['base_total_sales_money_object'];

        $this->assertSame('$20,345.00', $total_sales['display']);
        $this->assertSame('$20.3K', $total_sales['short_display']);
        $this->assertSame('$20.3K', $overview['metrics']['base_net_sales_money_object']['short_display']);
        $this->assertSame('$20.3K', $overview['top_products'][0]['base_revenue_money_object']['short_display']);
        $this->assertArrayNotHasKey('short_display', $overview['recent_orders'][0]['invoiced_total_money_object']);
        $this->assertArrayNotHasKey('short_display', $overview['recent_orders'][0]['base_total_money_object']);
    }

    /**
     * Build variant attributes for a product request or a variant row.
     *
     * @param array $overrides Variant attribute overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function variant_payload(array $overrides = []): array
    {
        return array_merge([
            'base_price' => 10,
            'sku' => 'SKU-' . wp_generate_password(6, false),
            'available_quantity' => 0,
            'in_stock' => true,
            'is_default' => false,
            'attribute_values' => [],
        ], $overrides);
    }

    /**
     * Get the overview data from the endpoint.
     *
     * @return array
     * @since 1.0.0
     */
    protected function get_overview(): array
    {
        return $this->assert_api_success($this->request('GET', 'dashboard/overview'))['data'];
    }

    /**
     * Convert a money object to minor units.
     *
     * @param array $money_object Money object from the response.
     *
     * @return int
     * @since 1.0.0
     */
    protected function minor(array $money_object): int
    {
        return (int) round($money_object['raw'] * 100);
    }

    /**
     * Create a paid USD order with optional items and creation time.
     *
     * @param array       $attributes Order attributes.
     * @param array       $items      Item attributes, one array per item.
     * @param string|null $created_at Creation time, if it matters.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function create_order(array $attributes, array $items = [], $created_at = null): Order
    {
        $order = Order::create(array_merge([
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
            'payment_status' => PaymentStatus::PAID,
        ], $attributes));

        foreach ($items as $item) {
            OrderItem::create(array_merge([
                'order_id' => $order->id,
                'product_id' => null,
                'product_name' => 'Product',
                'invoiced_price' => 0,
                'base_price' => 0,
                'quantity' => 1,
            ], $item));
        }

        if ($created_at !== null) {
            Order::query()->where('id', $order->id)->update(['created_at' => $created_at]);
        }

        return $order;
    }

    /**
     * Record a refund on an order.
     *
     * @param Order  $order           Refunded order.
     * @param int    $invoiced_amount Amount in the order currency, in minor units.
     * @param string $status          Refund status.
     *
     * @return Refund
     * @since 1.0.0
     */
    protected function create_refund(Order $order, int $invoiced_amount, string $status): Refund
    {
        return Refund::create([
            'order_id' => $order->id,
            'status' => $status,
            'invoiced_amount' => $invoiced_amount,
        ]);
    }
}
