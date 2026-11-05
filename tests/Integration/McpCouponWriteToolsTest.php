<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerExcludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerIncludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Mcp\Tools\CreateCouponTool;
use Kirki\Ecommerce\App\Mcp\Tools\SetCouponStateTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdateCouponTool;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\RunsWriteTools;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 5.8: the coupon write tools.
 *
 * Spec: mcp-coupon-write-tools, and mcp-write-tool-conventions for the annotations.
 */
class McpCouponWriteToolsTest extends RestTestCase
{
    use RunsWriteTools;
    use SeedsTestCurrency;

    /**
     * Start every test with an administrator, a base currency and no coupons.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->login_as_admin();
        $this->seed_base_currency();
        Coupon::query()->delete();
    }

    /**
     * Get the arguments of a 20% code coupon.
     *
     * @param array $overrides Argument overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function coupon_arguments(array $overrides = []): array
    {
        return array_merge([
            'method' => CouponMethod::CODE,
            'title' => 'Black Friday',
            'code' => 'BF20',
            'discount_type' => DiscountType::AMOUNT_OFF,
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::PERCENTAGE,
            'discount_amount' => 20,
            'start_datetime' => '2026-11-01T00:00:00+00:00',
            'has_end_datetime' => true,
            'end_datetime' => '2026-11-30T23:59:00+00:00',
            'customer_include_eligibility' => CustomerIncludeEligibility::EVERYONE,
            'customer_exclude_eligibility' => CustomerExcludeEligibility::NONE,
            'is_active' => true,
        ], $overrides);
    }

    /**
     * Create a coupon through the admin API.
     *
     * @param array $overrides Field overrides.
     *
     * @return int Coupon ID.
     * @since 1.0.0
     */
    protected function admin_coupon(array $overrides = []): int
    {
        $payload = $this->assert_api_success($this->request('POST', 'coupons', $this->coupon_arguments(array_merge(['code' => 'ADM-' . wp_generate_password(6, false)], $overrides))), 201);

        return (int) $payload['data']['id'];
    }

    /**
     * Scenario "Black Friday code": the preview has the plain-words rules and the coupon is created.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_black_friday_code(): void
    {
        $preview = $this->preview(CreateCouponTool::class, $this->coupon_arguments());
        $this->assertContains('20% off the order.', $preview['changes']['rules']);
        $this->assertSame(0, Coupon::query()->where('code', 'BF20')->count());

        $done = $this->confirm(CreateCouponTool::class, $this->coupon_arguments());

        $this->assertSame('BF20', $done['coupon']['code']);
        $this->assertTrue($done['coupon']['has_end_datetime']);
        $this->assertSame(1, Coupon::query()->where('code', 'BF20')->count());
    }

    /**
     * A fixed discount is stored in minor units.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_fixed_discount(): void
    {
        $done = $this->confirm(CreateCouponTool::class, $this->coupon_arguments(['code' => 'TEN', 'discount_value_type' => DiscountValueType::FIXED, 'discount_amount' => 10.5]));

        $this->assertSame(1050, (int) Coupon::query()->find($done['coupon']['coupon_id'])->base_discount_amount_fixed);
        $this->assertSame(10.5, $done['coupon']['discount_amount']);
    }

    /**
     * Scenario "Code exists": no token is given.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_code_exists(): void
    {
        $this->admin_coupon(['code' => 'BF20']);

        $this->assertArrayHasKey('code', $this->errors(CreateCouponTool::class, $this->coupon_arguments()));
    }

    /**
     * Scenario "Generated code": the confirmed call sends the code of the preview.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_generated_code(): void
    {
        $arguments = $this->coupon_arguments(['code' => null]);
        unset($arguments['code']);

        $preview = $this->preview(CreateCouponTool::class, $arguments);
        $code = $preview['changes']['code'];
        $this->assertNotEmpty($code);

        $without_code = $this->run_tool(CreateCouponTool::class, $arguments + ['confirmation_token' => $preview['confirmation_token']]);
        $this->assertTrue($without_code->is_error());

        $preview = $this->preview(CreateCouponTool::class, $arguments);
        $done = $this->run_tool(CreateCouponTool::class, $arguments + ['code' => $preview['changes']['code'], 'confirmation_token' => $preview['confirmation_token']])->content();
        $this->assertSame($preview['changes']['code'], $done['coupon']['code']);
    }

    /**
     * Scenarios "Stop a leaked code" and "Already inactive", and a copy.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_coupon_state(): void
    {
        $coupon_id = $this->admin_coupon();

        $done = $this->confirm(SetCouponStateTool::class, ['coupon_id' => $coupon_id, 'action' => 'deactivate']);
        $this->assertFalse($done['coupon']['is_active']);
        $this->assertFalse((bool) Coupon::query()->find($coupon_id)->is_active);

        $this->assertArrayHasKey('action', $this->errors(SetCouponStateTool::class, ['coupon_id' => $coupon_id, 'action' => 'deactivate']));

        $copy = $this->confirm(SetCouponStateTool::class, ['coupon_id' => $coupon_id, 'action' => 'duplicate']);
        $this->assertNotSame($coupon_id, $copy['coupon']['coupon_id']);
        $this->assertStringEndsWith(' - Copy', $copy['coupon']['title']);
    }

    /**
     * Scenario "Extend the end date": only the end date-time changes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_extend_the_end_date(): void
    {
        $coupon_id = $this->admin_coupon(['title' => 'Autumn', 'discount_amount' => 15]);

        $preview = $this->preview(UpdateCouponTool::class, ['coupon_id' => $coupon_id, 'end_datetime' => '2026-12-31T23:59:00+00:00']);
        $this->assertSame(['end_datetime'], array_keys($preview['changes']['fields']));

        $this->confirm(UpdateCouponTool::class, ['coupon_id' => $coupon_id, 'end_datetime' => '2026-12-31T23:59:00+00:00']);

        $stored = Coupon::query()->find($coupon_id);
        $this->assertStringStartsWith('2026-12-31', (string) $stored->end_datetime);
        $this->assertSame('Autumn', $stored->title);
        $this->assertSame(15, (int) $stored->discount_amount_percentage);
    }

    /**
     * Scenario "Not valid together", and the annotations.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_not_valid_together_and_annotations(): void
    {
        $coupon_id = $this->admin_coupon();

        $this->assertArrayHasKey('usage_limit', $this->errors(UpdateCouponTool::class, ['coupon_id' => $coupon_id, 'has_usage_limit' => true]));

        $this->assertFalse(app()->make(CreateCouponTool::class)->destructive());
        $this->assertTrue(app()->make(SetCouponStateTool::class)->destructive());
        $this->assertSame(['anthropic/requiresUserInteraction' => true], app()->make(UpdateCouponTool::class)->meta());
    }
}
