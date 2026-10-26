<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\App\Mcp\Tools\FindCouponsTool;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 6.6: the find-coupons MCP tool.
 *
 * Spec: mcp-coupon-tools.
 */
class McpCouponToolsTest extends RestTestCase
{
    use SeedsAnalyticsData;

    /**
     * Start every test with no coupons.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
        Coupon::query()->delete();
    }

    /**
     * Run the tool and get its structured content.
     *
     * @param array $arguments Tool arguments.
     *
     * @return array
     * @since 1.0.0
     */
    protected function call(array $arguments = []): array
    {
        $response = app()->make(FindCouponsTool::class)->handle(new Request($arguments));

        $this->assertSame('structured', $response->kind());

        return $response->content();
    }

    /**
     * Create a coupon.
     *
     * @param string $code      Coupon code.
     * @param array  $overrides Coupon attribute overrides.
     *
     * @return Coupon
     * @since 1.0.0
     */
    protected function make_coupon(string $code, array $overrides = []): Coupon
    {
        return Coupon::create(array_merge([
            'title' => $code,
            'code' => $code,
            'method' => 'code',
            'discount_type' => 'amount-off',
            'discount_value_type' => 'percentage',
            'discount_amount_percentage' => 10,
            'is_active' => true,
            'start_datetime' => '2020-01-01 00:00:00',
        ], $overrides));
    }

    /**
     * Scenario "Active coupons": 2 active and 1 expired coupons, status active gives the 2 active ones.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_active_coupons(): void
    {
        $first = $this->make_coupon('SAVE10');
        $second = $this->make_coupon('FIVEOFF', ['discount_value_type' => 'fixed', 'base_discount_amount_fixed' => 500, 'discount_amount_percentage' => null]);
        $this->make_coupon('OLD', ['has_end_datetime' => true, 'end_datetime' => '2021-01-01 00:00:00']);

        $result = $this->call(['status' => 'active']);
        $rows = array_column($result['coupons'], null, 'coupon_id');

        $this->assertEqualsCanonicalizing([$first->id, $second->id], array_keys($rows));
        $this->assertSame(10.0, $rows[$first->id]['discount_percentage']);
        $this->assertNull($rows[$first->id]['base_discount_amount']);
        $this->assertSame(5.0, $rows[$second->id]['base_discount_amount']['amount']);
        $this->assertSame('active', $rows[$second->id]['status']);
        $this->assertSame(2, $result['pagination']['total']);
    }

    /**
     * Scenario "Coupon near its limit": usage count 97 and usage limit 100.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_coupon_near_its_limit(): void
    {
        $this->make_coupon('BUSY', ['has_usage_limit' => true, 'usage_limit' => 100, 'current_usage_count' => 97, 'has_customer_limit' => true, 'customer_limit' => 1]);

        $row = $this->call(['search' => 'BUSY'])['coupons'][0];

        $this->assertSame(97, $row['usage_count']);
        $this->assertSame(100, $row['usage_limit']);
        $this->assertSame(1, $row['limit_per_customer']);
        $this->assertNull($row['ends_at']);
    }

    /**
     * Scenario "Unknown method" and "Unknown status": the error names the argument and lists the allowed values.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_method_and_status(): void
    {
        foreach (['method' => 'manual', 'status' => 'paused'] as $argument => $value) {
            try {
                $this->call([$argument => $value]);
                $this->fail('The tool did not reject ' . $argument);
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey($argument, $exception->get_errors());
            }
        }

        try {
            $this->call(['status' => 'paused']);
        } catch (ValidationException $exception) {
            $this->assertStringContainsString('active, scheduled, inactive, expired', $exception->get_errors()['status'][0]);
        }
    }
}
