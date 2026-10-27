<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\App\Mcp\Tools\ProductPerformanceTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesBreakdownTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesTrendTool;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 4.4: the sales trend, product performance and sales breakdown MCP tools.
 *
 * Spec: mcp-analytics-tools.
 */
class McpAnalyticsToolsTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsAnalyticsData;

    /**
     * Start every test from an empty store, with today frozen at Oct 26, 2026.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
        $this->freeze_today('2026-10-26');
    }

    /**
     * Run a tool and get its structured content.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return array
     * @since 1.0.0
     */
    protected function call(string $tool, array $arguments = []): array
    {
        $response = app()->make($tool)->handle(new Request($arguments));

        $this->assertSame('structured', $response->kind());

        return $response->content();
    }

    /**
     * Run a tool and get the validation errors it throws.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return array<string, string[]>
     * @since 1.0.0
     */
    protected function validation_errors(string $tool, array $arguments): array
    {
        try {
            $this->call($tool, $arguments);
        } catch (ValidationException $exception) {
            return $exception->get_errors();
        }

        $this->fail('The tool did not reject the arguments.');
    }

    /**
     * Create a paid sale of a named item that is not in the catalog.
     *
     * @param string $paid_at  Payment time, UTC.
     * @param string $name     Item name.
     * @param int    $subtotal Amount in minor units.
     *
     * @return void
     * @since 1.0.0
     */
    protected function make_named_sale(string $paid_at, string $name, int $subtotal): void
    {
        $this->make_order(
            ['base_subtotal' => $subtotal, 'invoiced_subtotal' => $subtotal, 'base_total' => $subtotal, 'invoiced_total' => $subtotal, 'items_count' => 1],
            [['product_name' => $name, 'base_subtotal' => $subtotal, 'invoiced_subtotal' => $subtotal, 'base_total' => $subtotal, 'invoiced_total' => $subtotal]],
            $paid_at,
            $paid_at
        );
    }

    /**
     * Scenario "Same range as the sales report" and "Daily series": last_7 is Oct 20 – Oct 26 with 7 daily points and no comparison.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sales_trend_last_7_days(): void
    {
        $trend = $this->call(SalesTrendTool::class, ['range' => 'last_7']);

        $this->assertSame(['preset' => 'last_7', 'from' => '2026-10-20', 'to' => '2026-10-26', 'days' => 7], $trend['range']);
        $this->assertNull($trend['compare']);
        $this->assertSame('day', $trend['granularity']);
        $this->assertSame('UTC', $trend['time_zone']);
        $this->assertSame('USD', $trend['currency']);
        $this->assertCount(7, $trend['series']);
        $this->assertSame('2026-10-20', $trend['series'][0]['date']);
        $this->assertSame('2026-10-26', $trend['series'][6]['date']);
        $this->assertArrayNotHasKey('previous_total_sales', $trend['series'][0]);
    }

    /**
     * Scenario "Same numbers as the Analytics page": the daily point and the range totals equal the KPI cards.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sales_trend_numbers_equal_the_analytics_page(): void
    {
        $this->make_sale('2026-10-21 10:00:00', 10000);
        $this->make_sale('2026-10-23 10:00:00', 5000);

        $trend = $this->call(SalesTrendTool::class, ['range' => 'last_7']);
        $points = array_column($trend['series'], null, 'date');
        $cards = app()->make(AnalyticsQueryService::class)->get_metric('kpis', ['range' => 'last_7', 'compare' => 'none'])['data'];

        $this->assertSame(100.0, $points['2026-10-21']['total_sales']);
        $this->assertSame(1, $points['2026-10-21']['orders']);
        $this->assertSame(100.0, $points['2026-10-21']['average_order_value']);
        $this->assertSame(150.0, $trend['totals']['total_sales']['current']['amount']);
        $this->assertSame($cards['total_sales']['current_money_object']->raw, $trend['totals']['total_sales']['current']['amount']);
        $this->assertSame($cards['orders']['current'], $trend['totals']['orders']['current']);
        $this->assertSame($cards['average_order_value']['current_money_object']->raw, $trend['totals']['average_order_value']['current']['amount']);
    }

    /**
     * With a comparison, each point has its previous values and each total has a change.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sales_trend_with_a_comparison(): void
    {
        $this->make_sale('2026-10-14 10:00:00', 2000);
        $this->make_sale('2026-10-21 10:00:00', 4000);

        $trend = $this->call(SalesTrendTool::class, ['range' => 'last_7', 'compare' => 'previous_period']);
        $point = array_column($trend['series'], null, 'date')['2026-10-21'];

        $this->assertNotNull($trend['compare']);
        $this->assertSame('2026-10-14', $point['previous_date']);
        $this->assertSame(20.0, $point['previous_total_sales']);
        $this->assertSame(1, $point['previous_orders']);
        $this->assertSame(20.0, $point['previous_average_order_value']);
        $this->assertSame(20.0, $trend['totals']['total_sales']['previous']['amount']);
        $this->assertNotNull($trend['totals']['total_sales']['change']);
    }

    /**
     * Scenario "End date after today": the call is rejected and names "to".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_end_date_after_today_is_rejected(): void
    {
        $errors = $this->validation_errors(ProductPerformanceTool::class, ['range' => 'custom', 'from' => '2026-10-01', 'to' => '2026-11-01']);

        $this->assertArrayHasKey('to', $errors);
    }

    /**
     * Scenario "Top 10 products": 12 products sold, limit 10 gives 10 rows, highest net sales first.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_top_10_products(): void
    {
        for ($index = 1; $index <= 12; $index++) {
            $this->make_named_sale('2026-10-21 10:00:00', 'Item ' . $index, $index * 1000);
        }

        $result = $this->call(ProductPerformanceTool::class, ['range' => 'last_7', 'limit' => 10]);

        $this->assertSame('product', $result['by']);
        $this->assertCount(10, $result['rows']);
        $this->assertSame('Item 12', $result['rows'][0]['name']);
        $this->assertSame(120.0, $result['rows'][0]['net_sales']['amount']);
        $this->assertSame(1, $result['rows'][0]['units_sold']);
        $this->assertTrue($result['rows'][0]['is_deleted']);
        $this->assertArrayNotHasKey('image', $result['rows'][0]);
        $this->assertSame('Item 3', $result['rows'][9]['name']);
    }

    /**
     * Without a limit, the tool gives 5 products, the same as the Analytics page.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_default_product_limit(): void
    {
        for ($index = 1; $index <= 7; $index++) {
            $this->make_named_sale('2026-10-21 10:00:00', 'Item ' . $index, $index * 1000);
        }

        $this->assertCount(5, $this->call(ProductPerformanceTool::class, ['range' => 'last_7'])['rows']);
    }

    /**
     * Scenario "Default category limit": 8 categories sold and no limit gives 6 category rows.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_default_category_limit(): void
    {
        for ($index = 1; $index <= 8; $index++) {
            $category_id = $this->create_category('Trend category ' . $index);
            $product_id = $this->create_product(['categories' => [$category_id]])['id'];
            $this->make_order(
                ['base_subtotal' => 1000, 'invoiced_subtotal' => 1000, 'base_total' => 1000, 'invoiced_total' => 1000, 'items_count' => 1],
                [['product_id' => $product_id, 'base_subtotal' => 1000, 'invoiced_subtotal' => 1000, 'base_total' => 1000, 'invoiced_total' => 1000]],
                '2026-10-21 10:00:00',
                '2026-10-21 10:00:00'
            );
        }

        $result = $this->call(ProductPerformanceTool::class, ['range' => 'last_7', 'by' => 'category']);

        $this->assertSame('category', $result['by']);
        $this->assertCount(6, $result['rows']);
        $this->assertSame(10.0, $result['rows'][0]['net_sales']['amount']);
    }

    /**
     * Scenario "Limit over the maximum": limit 100 is rejected and names "limit". An unknown "by" names "by".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_performance_validation(): void
    {
        $this->assertArrayHasKey('limit', $this->validation_errors(ProductPerformanceTool::class, ['limit' => 100]));
        $this->assertArrayHasKey('limit', $this->validation_errors(ProductPerformanceTool::class, ['limit' => 0]));
        $this->assertArrayHasKey('by', $this->validation_errors(ProductPerformanceTool::class, ['by' => 'brand']));
    }

    /**
     * Scenario "Sales by coupon": each code has its order count and discount given.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sales_by_coupon(): void
    {
        foreach (['SAVE10' => 2, 'WELCOME' => 1] as $code => $orders) {
            for ($index = 0; $index < $orders; $index++) {
                $order = $this->make_sale('2026-10-21 10:00:00', 5000, ['base_discount_total' => 500]);
                OrderCoupon::create([
                    'order_id' => $order->id,
                    'code' => $code,
                    'title' => $code,
                    'discount_type' => 'percentage',
                    'invoiced_discount_amount' => 500,
                    'base_discount_amount' => 500,
                ]);
            }
        }

        $result = $this->call(SalesBreakdownTool::class, ['range' => 'last_7', 'by' => 'coupon']);
        $rows = array_column($result['rows'], null, 'code');

        $this->assertSame('coupon', $result['by']);
        $this->assertSame(2, $rows['SAVE10']['orders']);
        $this->assertSame(10.0, $rows['SAVE10']['discount_given']['amount']);
        $this->assertSame(1, $rows['WELCOME']['orders']);
    }

    /**
     * Sales by country lists every country with sales, orders and customers.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sales_by_country(): void
    {
        $this->make_sale('2026-10-21 10:00:00', 3000, ['shipping_country' => 'DE']);
        $this->make_sale('2026-10-22 10:00:00', 2000, ['shipping_country' => 'US']);

        $rows = array_column($this->call(SalesBreakdownTool::class, ['range' => 'last_7', 'by' => 'country'])['rows'], null, 'code');

        $this->assertSame(['DE', 'US'], array_keys($rows));
        $this->assertSame(30.0, $rows['DE']['sales']['amount']);
        $this->assertSame(1, $rows['DE']['orders']);
        $this->assertSame(1, $rows['DE']['customers']);
    }

    /**
     * Scenario "Regions of one country": each row is a state of the United States with sales, orders and customers.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_regions_of_one_country(): void
    {
        $this->make_sale('2026-10-21 10:00:00', 9000, ['shipping_country' => 'US', 'shipping_state' => 'CA']);
        $this->make_sale('2026-10-21 10:00:00', 4000, ['shipping_country' => 'US', 'shipping_state' => 'NY']);

        $result = $this->call(SalesBreakdownTool::class, ['range' => 'last_7', 'by' => 'region', 'country' => 'us']);

        $this->assertSame('US', $result['country']);
        $this->assertSame(['California', 'New York'], array_column($result['top_by_sales'], 'name'));
        $this->assertSame(90.0, $result['top_by_sales'][0]['sales']['amount']);
        $this->assertSame(1, $result['top_by_orders'][0]['orders']);
        $this->assertCount(2, $result['top_by_customers']);
    }

    /**
     * Scenario "Regions need a country" and the other validation errors of the breakdown tool.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sales_breakdown_validation(): void
    {
        $this->assertArrayHasKey('country', $this->validation_errors(SalesBreakdownTool::class, ['by' => 'region']));
        $this->assertArrayHasKey('country', $this->validation_errors(SalesBreakdownTool::class, ['by' => 'region', 'country' => 'XX']));
        $this->assertArrayHasKey('by', $this->validation_errors(SalesBreakdownTool::class, []));
        $this->assertArrayHasKey('by', $this->validation_errors(SalesBreakdownTool::class, ['by' => 'product']));
        $this->assertArrayHasKey('limit', $this->validation_errors(SalesBreakdownTool::class, ['by' => 'country', 'limit' => 3]));
        $this->assertArrayHasKey('limit', $this->validation_errors(SalesBreakdownTool::class, ['by' => 'coupon', 'limit' => 26]));
        $this->assertArrayHasKey('range', $this->validation_errors(SalesTrendTool::class, ['range' => 'last_week']));
    }
}
