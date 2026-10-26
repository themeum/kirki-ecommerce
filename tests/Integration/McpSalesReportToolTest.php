<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Mcp\Tools\SalesReportTool;
use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 2.6: arguments, validation, content and access of the sales report MCP tool.
 *
 * Spec: mcp-sales-report.
 */
class McpSalesReportToolTest extends RestTestCase
{
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
     * Run the tool and get its structured content.
     *
     * @param array $arguments Tool arguments.
     *
     * @return array
     * @since 1.0.0
     */
    protected function report(array $arguments = []): array
    {
        $response = app()->make(SalesReportTool::class)->handle(new Request($arguments));

        $this->assertSame('structured', $response->kind());

        return $response->content();
    }

    /**
     * Run the tool and get the validation errors it throws.
     *
     * @param array $arguments Tool arguments.
     *
     * @return array<string, string[]>
     * @since 1.0.0
     */
    protected function validation_errors(array $arguments): array
    {
        try {
            $this->report($arguments);
        } catch (ValidationException $exception) {
            return $exception->get_errors();
        }

        $this->fail('The tool did not reject the arguments.');
    }

    /**
     * Scenario "Tool annotations": the tool is read-only and idempotent, and only its servers offer it.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tool_identity(): void
    {
        $tool = app()->make(SalesReportTool::class);

        $this->assertSame('kirki-ecommerce/sales-report', $tool->name());
        $this->assertTrue($tool->read_only());
        $this->assertTrue($tool->idempotent());
        $this->assertFalse($tool->is_public());
        $this->assertFalse($tool->shows_in_rest());
    }

    /**
     * The registrar reads input_schema(). A tool that still declares only schema() would send no arguments.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_input_schema_declares_the_range(): void
    {
        $schema = JsonSchema::object_from_map(app()->make(SalesReportTool::class)->input_schema(new JsonSchema()));

        $this->assertSame(AnalyticsRangeResolver::PRESETS, $schema['properties']['range']['enum']);
        $this->assertSame('last_30', $schema['properties']['range']['default']);
    }

    /**
     * Scenario "Last 7 days": the range is Oct 20 – Oct 26, 2026 and has 7 days.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_last_7_days(): void
    {
        $report = $this->report(['range' => 'last_7']);

        $this->assertSame(['preset' => 'last_7', 'from' => '2026-10-20', 'to' => '2026-10-26', 'days' => 7], $report['range']);
        $this->assertSame('day', $report['granularity']);
        $this->assertCount(7, $report['series']);
    }

    /**
     * Scenario "No range": the range is the last 30 days.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_no_range_is_last_30_days(): void
    {
        $report = $this->report();

        $this->assertSame('2026-09-27', $report['range']['from']);
        $this->assertSame('2026-10-26', $report['range']['to']);
    }

    /**
     * Scenario "Custom range": the range is Sep 1 – Sep 30, 2026.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_custom_range(): void
    {
        $report = $this->report(['range' => 'custom', 'from' => '2026-09-01', 'to' => '2026-09-30']);

        $this->assertSame('2026-09-01', $report['range']['from']);
        $this->assertSame('2026-09-30', $report['range']['to']);
        $this->assertSame(30, $report['range']['days']);
    }

    /**
     * Scenario "No comparison by default": compare is null, and every previous value and change is null.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_no_comparison_by_default(): void
    {
        $this->make_sale('2026-10-15 10:00:00', 1000);
        $this->make_sale('2026-10-22 10:00:00', 2000);

        $report = $this->report(['range' => 'last_7']);

        $this->assertNull($report['compare']);

        foreach ($report['totals'] as $key => $total) {
            $this->assertNull($total['previous'], $key);
            $this->assertNull($total['change'], $key);
        }

        $this->assertArrayNotHasKey('previous_total_sales', $report['series'][0]);
    }

    /**
     * Scenario "Previous period when asked": the comparison is Oct 13 – Oct 19, 2026, with previous values and changes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_previous_period_when_asked(): void
    {
        $this->make_sale('2026-10-15 10:00:00', 1000);
        $this->make_sale('2026-10-22 10:00:00', 2000);

        $report = $this->report(['range' => 'last_7', 'compare' => 'previous_period']);

        $this->assertSame(['from' => '2026-10-13', 'to' => '2026-10-19'], $report['compare']);
        $this->assertSame(20.0, (float) $report['totals']['total_sales']['current']['amount']);
        $this->assertSame(10.0, (float) $report['totals']['total_sales']['previous']['amount']);
        $this->assertEquals(100.0, $report['totals']['total_sales']['change']);
        $this->assertSame(1, $report['totals']['orders']['previous']);
        $this->assertSame('2026-10-13', $report['series'][0]['previous_date']);
        $this->assertArrayHasKey('previous_total_sales', $report['series'][0]);
        $this->assertArrayHasKey('previous_orders', $report['series'][0]);
    }

    /**
     * Data for invalid arguments: the arguments and the argument the error is on.
     *
     * @return array
     * @since 1.0.0
     */
    public function invalid_arguments(): array
    {
        return [
            'unknown preset' => [['range' => 'last_week'], 'range'],
            'unknown comparison' => [['compare' => 'last_week'], 'compare'],
            'custom without from' => [['range' => 'custom', 'to' => '2026-10-10'], 'from'],
            'custom without to' => [['range' => 'custom', 'from' => '2026-10-01'], 'to'],
            'from not a date' => [['range' => 'custom', 'from' => '2026-13-45', 'to' => '2026-10-10'], 'from'],
            'to in the future' => [['range' => 'custom', 'from' => '2026-10-01', 'to' => '2026-10-30'], 'to'],
            'from after to' => [['range' => 'custom', 'from' => '2026-10-10', 'to' => '2026-10-01'], 'from'],
            'custom comparison without compare_from' => [['compare' => 'custom', 'compare_to' => '2026-09-10'], 'compare_from'],
            'custom comparison without compare_to' => [['compare' => 'custom', 'compare_from' => '2026-09-01'], 'compare_to'],
            'compare_from after compare_to' => [['compare' => 'custom', 'compare_from' => '2026-09-10', 'compare_to' => '2026-09-01'], 'compare_from'],
        ];
    }

    /**
     * Requirement "Argument validation": each invalid input is rejected with an error on its argument that names it.
     *
     * @dataProvider invalid_arguments
     *
     * @param array  $arguments Tool arguments.
     * @param string $field     Argument the error is on.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_invalid_arguments_are_rejected(array $arguments, string $field): void
    {
        $errors = $this->validation_errors($arguments);

        $this->assertArrayHasKey($field, $errors);
        $this->assertStringContainsString($field, implode(' ', (array) $errors[$field]));
    }

    /**
     * Scenario "Future end date": the error says that the end date cannot be after today.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_future_end_date_message(): void
    {
        $errors = $this->validation_errors(['range' => 'custom', 'from' => '2026-10-01', 'to' => '2026-10-30']);

        $this->assertStringContainsString('cannot be after today', $errors['to'][0]);
    }

    /**
     * Scenario "Same as the Analytics page": every total equals the matching number of the Analytics endpoint.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_totals_are_the_same_as_the_analytics_page(): void
    {
        $this->login_as_admin();
        $this->make_sale('2026-10-01 10:00:00', 1500, ['base_discount_total' => 200, 'base_shipping_total' => 300, 'base_tax_total' => 100]);
        $this->make_sale('2026-10-20 10:00:00', 2500);
        $this->make_order(['payment_status' => PaymentStatus::UNPAID, 'base_total' => 900], [[]], null, '2026-10-21 10:00:00');

        $report = $this->report(['range' => 'last_30']);
        $kpis = $this->metric('kpis', ['range' => 'last_30']);
        $breakdown = $this->metric('total_sales_breakdown', ['range' => 'last_30']);

        $rows = array_column($breakdown['data']['rows'], null, 'key');

        foreach (['gross_sales', 'discounts', 'returns', 'net_sales', 'shipping', 'taxes', 'total_sales'] as $key) {
            $this->assertEquals($rows[$key]['current_money_object']['raw'], $report['totals'][$key]['current']['amount'], $key);
        }

        $this->assertEquals($kpis['data']['average_order_value']['current_money_object']['raw'], $report['totals']['average_order_value']['current']['amount']);

        foreach (['orders', 'items_ordered', 'customers', 'new_customers'] as $key) {
            $this->assertSame($kpis['data'][$key]['current'], $report['totals'][$key]['current'], $key);
        }

        $this->assertSame(count($kpis['data']['total_sales']['series']), count($report['series']));
        $this->assertEquals(40.0, $report['totals']['gross_sales']['current']['amount']);
    }

    /**
     * Scenario "Only sales orders count": an unpaid order counts as an order but not as a sale.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_only_sales_orders_count_in_sales(): void
    {
        $this->make_sale('2026-10-24 10:00:00', 5000);
        $this->make_order(['payment_status' => PaymentStatus::UNPAID, 'base_total' => 3000], [[]], null, '2026-10-24 11:00:00');

        $report = $this->report(['range' => 'last_7']);

        $this->assertSame(50.0, (float) $report['totals']['total_sales']['current']['amount']);
        $this->assertSame('USD', $report['totals']['total_sales']['current']['currency']);
        $this->assertNotEmpty($report['totals']['total_sales']['current']['display']);
        $this->assertSame(2, $report['totals']['orders']['current']);
        $this->assertSame('USD', $report['currency']);
    }

    /**
     * Scenario "Empty range": money totals and counts are zero, has_orders is true, and every bucket has a zero point.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_empty_range(): void
    {
        $this->make_sale('2026-01-10 10:00:00', 5000);

        $report = $this->report(['range' => 'last_7']);

        $this->assertTrue($report['has_orders']);

        foreach (['gross_sales', 'discounts', 'returns', 'net_sales', 'shipping', 'taxes', 'total_sales'] as $key) {
            $this->assertSame(0.0, (float) $report['totals'][$key]['current']['amount'], $key);
        }

        foreach (['orders', 'items_ordered', 'customers', 'new_customers'] as $key) {
            $this->assertSame(0, $report['totals'][$key]['current'], $key);
        }

        $this->assertCount(7, $report['series']);

        foreach ($report['series'] as $point) {
            $this->assertSame(0.0, (float) $point['total_sales']);
            $this->assertSame(0, $point['orders']);
        }
    }

    /**
     * Scenario "Late order": with no time zone header, the order is put on a day in the site time zone.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_site_time_zone_without_a_header(): void
    {
        $this->set_timezone('Asia/Dhaka');
        $this->make_sale('2026-10-01 20:30:00', 1000);

        $report = $this->report(['range' => 'custom', 'from' => '2026-10-01', 'to' => '2026-10-02']);

        $this->assertSame('Asia/Dhaka', $report['time_zone']);
        $this->assertSame(['2026-10-01', '2026-10-02'], array_column($report['series'], 'date'));
        $this->assertSame([0.0, 10.0], array_map('floatval', array_column($report['series'], 'total_sales')));
    }

    /**
     * The tool permission is true for an administrator.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_administrator_can_run_the_tool(): void
    {
        wp_set_current_user(static::factory()->user->create(['role' => 'administrator']));

        $this->assertTrue(app()->make(SalesReportTool::class)->permission());
    }

    /**
     * The tool permission is false for an editor.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_editor_cannot_run_the_tool(): void
    {
        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));

        $this->assertFalse(app()->make(SalesReportTool::class)->permission());
    }

    /**
     * The tool permission is false with no signed-in user.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_anonymous_user_cannot_run_the_tool(): void
    {
        $this->logout();

        $this->assertFalse(app()->make(SalesReportTool::class)->permission());
    }
}
