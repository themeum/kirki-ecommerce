<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Jobs\SendInventoryMailJob;
use Kirki\Ecommerce\App\Managers\OrderManager;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Supports\OrderNumberGenerator;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Framework\Wordpress\Models\Option as OptionModel;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\EnablesPaymentProviders;
use Kirki\Ecommerce\Tests\Support\Racing\RacingCouponService;
use Kirki\Ecommerce\Tests\Support\Racing\RacingOrderService;
use Kirki\Ecommerce\Tests\Support\Racing\StaleVariantService;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\with_prefix;

/**
 * Proves the guards that keep stock, coupons, refunds and order state correct when requests race.
 *
 * One PHP process has one database connection, so two requests cannot run at the
 * same instant here. Each test lets a competing change land after the operation
 * has read its data, which is the exact moment the old read-then-write code broke.
 *
 * @since 1.0.0
 */
class ConcurrencySafetyTest extends RestTestCase
{
    use CreatesTestProducts;
    use EnablesPaymentProviders;
    use SeedsTestShipping;

    /**
     * Variant id for the current test.
     *
     * @var int
     */
    protected $variant_id;

    /**
     * Seed an orderable product before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->enable_payment_provider();
        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $this->variant_id = $this->default_variant_id($this->create_product());
        $this->queue = Queue::fake();
    }

    /**
     * Drop every container instance a test replaced.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        foreach ([OrderService::class, CouponService::class, OrderManager::class, QueueManager::class] as $abstract) {
            static::forget_singleton($abstract);
        }

        parent::tearDown();
    }

    /**
     * The fake queue recording dispatched jobs.
     *
     * @var \Kirki\Ecommerce\Framework\Queue\QueueFake
     */
    protected $queue;

    /**
     * Reserving stock another request already took fails and changes nothing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reserve_stock_fails_when_the_last_unit_was_taken_after_the_read(): void
    {
        $this->stock(1);
        $stale = Variant::find($this->variant_id);
        Variant::where('id', $this->variant_id)->update(['available_quantity' => 0]);

        try {
            $this->inventory_over($stale)->reserve_stock($this->variant_id, 1);
            $this->fail('Reserving taken stock must fail.');
        } catch (ValidationException $e) {
            $this->assertSame('Insufficient stock to reserve.', $e->getMessage());
        }

        $variant = Variant::find($this->variant_id);
        $this->assertSame(0, (int) $variant->available_quantity);
        $this->assertSame(0, (int) $variant->committed_quantity);
    }

    /**
     * Decreasing stock another request already took fails and changes nothing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_decrement_stock_fails_when_the_last_unit_was_taken_after_the_read(): void
    {
        $this->stock(1);
        $stale = Variant::find($this->variant_id);
        Variant::where('id', $this->variant_id)->update(['available_quantity' => 0]);

        try {
            $this->inventory_over($stale)->decrement_stock($this->variant_id, 1);
            $this->fail('Decreasing taken stock must fail.');
        } catch (ValidationException $e) {
            $this->assertSame('Insufficient stock.', $e->getMessage());
        }

        $this->assertSame(0, (int) Variant::find($this->variant_id)->available_quantity);
    }

    /**
     * A back-order variant may go below zero.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reserve_stock_allows_a_back_order_variant_to_go_negative(): void
    {
        $this->stock(1);
        Variant::where('id', $this->variant_id)->update(['allow_back_order' => true]);

        $this->assertTrue($this->inventory()->reserve_stock($this->variant_id, 3));

        $variant = Variant::find($this->variant_id);
        $this->assertSame(-2, (int) $variant->available_quantity);
        $this->assertSame(3, (int) $variant->committed_quantity);
    }

    /**
     * An untracked variant is never limited and never changed.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reserve_stock_ignores_an_untracked_variant(): void
    {
        $this->stock(1);
        Variant::where('id', $this->variant_id)->update(['track_inventory' => false]);

        $this->assertTrue($this->inventory()->reserve_stock($this->variant_id, 5));

        $variant = Variant::find($this->variant_id);
        $this->assertSame(1, (int) $variant->available_quantity);
        $this->assertSame(0, (int) $variant->committed_quantity);
    }

    /**
     * Releasing stock never takes more than is committed now, even when the read was stale.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_release_reserved_stock_clamps_to_the_committed_quantity_now(): void
    {
        $this->stock(10);
        Variant::where('id', $this->variant_id)->update(['committed_quantity' => 3]);
        $stale = Variant::find($this->variant_id);
        Variant::where('id', $this->variant_id)->update(['available_quantity' => 12, 'committed_quantity' => 1]);

        $this->inventory_over($stale)->release_reserved_stock($this->variant_id, 3);

        $variant = Variant::find($this->variant_id);
        $this->assertSame(0, (int) $variant->committed_quantity);
        $this->assertSame(13, (int) $variant->available_quantity);
    }

    /**
     * Confirming stock never takes more than is committed now, even when the read was stale.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_confirm_reserved_stock_clamps_to_the_committed_quantity_now(): void
    {
        $this->stock(10);
        Variant::where('id', $this->variant_id)->update(['committed_quantity' => 3]);
        $stale = Variant::find($this->variant_id);
        Variant::where('id', $this->variant_id)->update(['committed_quantity' => 1]);

        $this->inventory_over($stale)->confirm_reserved_stock($this->variant_id, 3);

        $variant = Variant::find($this->variant_id);
        $this->assertSame(0, (int) $variant->committed_quantity);
        $this->assertSame(10, (int) $variant->available_quantity);
    }

    /**
     * A release asks for more than is committed and moves only what is committed.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_release_reserved_stock_moves_only_what_is_committed(): void
    {
        $this->stock(10);
        Variant::where('id', $this->variant_id)->update(['committed_quantity' => 3]);

        $this->inventory()->release_reserved_stock($this->variant_id, 5);

        $variant = Variant::find($this->variant_id);
        $this->assertSame(0, (int) $variant->committed_quantity);
        $this->assertSame(13, (int) $variant->available_quantity);
    }

    /**
     * Two releases for the same committed stock move it once, never below zero.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_two_releases_for_the_same_committed_stock_move_it_once(): void
    {
        $this->stock(10);
        Variant::where('id', $this->variant_id)->update(['committed_quantity' => 2]);

        $this->inventory()->release_reserved_stock($this->variant_id, 2);
        $this->inventory()->release_reserved_stock($this->variant_id, 2);

        $variant = Variant::find($this->variant_id);
        $this->assertSame(0, (int) $variant->committed_quantity);
        $this->assertSame(12, (int) $variant->available_quantity);
    }

    /**
     * A confirm asks for more than is committed and leaves available stock alone.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_confirm_reserved_stock_removes_only_what_is_committed(): void
    {
        $this->stock(10);
        Variant::where('id', $this->variant_id)->update(['committed_quantity' => 3]);

        $this->inventory()->confirm_reserved_stock($this->variant_id, 5);

        $variant = Variant::find($this->variant_id);
        $this->assertSame(0, (int) $variant->committed_quantity);
        $this->assertSame(10, (int) $variant->available_quantity);
    }

    /**
     * A reserve moves one quantity between both columns in a single step.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reserve_stock_moves_the_quantity_from_available_to_committed(): void
    {
        $this->stock(5);

        $this->assertTrue($this->inventory()->reserve_stock($this->variant_id, 2));

        $variant = Variant::find($this->variant_id);
        $this->assertSame(3, (int) $variant->available_quantity);
        $this->assertSame(2, (int) $variant->committed_quantity);
    }

    /**
     * A losing reserve raises no low-stock or out-of-stock alert.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failed_reserve_raises_no_stock_alert(): void
    {
        $this->stock(6);
        Variant::where('id', $this->variant_id)->update(['low_stock_threshold' => 5]);
        $stale = Variant::find($this->variant_id);
        Variant::where('id', $this->variant_id)->update(['available_quantity' => 0]);
        $this->queue->clear();

        try {
            $this->inventory_over($stale)->reserve_stock($this->variant_id, 6);
        } catch (ValidationException $e) {
            // Expected: the stock is gone.
        }

        $this->assertCount(0, $this->queue->pushed(SendInventoryMailJob::class));
    }

    /**
     * An order that loses the race for the last coupon use fails and leaves nothing behind.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_fails_when_another_order_takes_the_last_coupon_use(): void
    {
        $coupon = $this->create_limited_coupon(['has_usage_limit' => true, 'usage_limit' => 1]);
        $this->stock(10);

        $racing = new RacingCouponService();
        $racing->before_count = fn() => Coupon::where('id', $coupon->id)->update(['current_usage_count' => 1]);
        app()->instance(CouponService::class, $racing);

        $orders_before = Order::query()->count();
        $response = $this->request('POST', 'orders', $this->order_payload(['coupon_codes' => [$coupon->code]]));

        $this->assertGreaterThanOrEqual(400, $response->get_status());
        // The failed request rolls back, taking the simulated competitor's write with it.
        $this->assertLessThanOrEqual(1, (int) Coupon::find($coupon->id)->current_usage_count);
        $this->assertSame($orders_before, Order::query()->count());
        $this->assertSame(0, (int) Variant::find($this->variant_id)->committed_quantity);
    }

    /**
     * A coupon without a limit is counted for every order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_coupon_without_a_limit_is_counted_for_every_order(): void
    {
        $coupon = $this->create_limited_coupon([]);

        $this->assert_api_success($this->request('POST', 'orders', $this->order_payload(['coupon_codes' => [$coupon->code]])), 201);
        $this->assert_api_success($this->request('POST', 'orders', $this->order_payload(['coupon_codes' => [$coupon->code]])), 201);

        $this->assertSame(2, (int) Coupon::find($coupon->id)->current_usage_count);
    }

    /**
     * Counting a coupon use stops at the usage limit.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_claim_usage_stops_at_the_usage_limit(): void
    {
        $coupon = $this->create_limited_coupon(['has_usage_limit' => true, 'usage_limit' => 2]);
        $service = new CouponService();

        $this->assertTrue($service->claim_usage($coupon->id));
        $this->assertTrue($service->claim_usage($coupon->id));
        $this->assertFalse($service->claim_usage($coupon->id));
        $this->assertSame(2, (int) Coupon::find($coupon->id)->current_usage_count);
    }

    /**
     * A coupon without a limit can always be counted.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_claim_usage_has_no_limit_for_an_unlimited_coupon(): void
    {
        $coupon = $this->create_limited_coupon([]);
        $service = new CouponService();

        $this->assertTrue($service->claim_usage($coupon->id));
        $this->assertTrue($service->claim_usage($coupon->id));
        $this->assertSame(2, (int) Coupon::find($coupon->id)->current_usage_count);
    }

    /**
     * Giving back a coupon use never takes the count below zero.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_release_usage_never_goes_below_zero(): void
    {
        $coupon = $this->create_limited_coupon(['current_usage_count' => 1]);
        $service = new CouponService();

        $this->assertTrue($service->release_usage($coupon->id));
        $this->assertFalse($service->release_usage($coupon->id));
        $this->assertSame(0, (int) Coupon::find($coupon->id)->current_usage_count);
    }

    /**
     * Two orders from one buyer cannot both pass a per-customer limit of one.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_fails_when_the_buyer_used_the_coupon_after_the_check(): void
    {
        $coupon = $this->create_limited_coupon(['has_customer_limit' => true, 'customer_limit' => 1]);
        $competing_order = $this->create_order();
        $orders_before = Order::query()->count();

        $racing = new RacingCouponService();
        $racing->before_count = fn() => OrderCoupon::create([
            'order_id' => $competing_order['id'],
            'coupon_id' => $coupon->id,
            'code' => $coupon->code,
            'title' => $coupon->title,
            'discount_type' => $coupon->discount_type,
        ]);
        app()->instance(CouponService::class, $racing);

        $response = $this->request('POST', 'orders', $this->order_payload(['coupon_codes' => [$coupon->code]]));

        $this->assertGreaterThanOrEqual(400, $response->get_status());
        $this->assertSame($orders_before, Order::query()->count());
    }

    /**
     * A second refund request cannot refund what a competing refund already covers.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_refund_fails_when_a_competing_refund_covers_the_amount_after_the_read(): void
    {
        $order = $this->create_order();
        $this->make_refundable($order['id']);
        $refundable = $this->refundable_minor($order['id']);

        $racing = new RacingOrderService();
        $racing->after_read = fn() => Refund::create([
            'order_id' => $order['id'],
            'status' => RefundStatus::PENDING,
            'invoiced_amount' => $refundable,
            'reason' => 'Competing request',
        ]);
        app()->instance(OrderService::class, $racing);

        $response = $this->request('POST', 'orders/' . $order['id'] . '/refunds', [
            'order_id' => $order['id'],
            'invoiced_amount' => $refundable / 100,
            'reason' => 'Customer request',
        ]);

        $error = $this->assert_api_error($response, 422);
        $this->assertSame('Refund amount exceeds refundable amount.', $error['message']);
    }

    /**
     * Two partial refunds that fit together are both recorded.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_partial_refunds_that_fit_together_are_both_recorded(): void
    {
        $order = $this->create_order();
        $this->make_refundable($order['id']);
        $half = intdiv($this->refundable_minor($order['id']), 2);

        foreach ([1, 2] as $attempt) {
            $this->assert_api_success($this->request('POST', 'orders/' . $order['id'] . '/refunds', [
                'order_id' => $order['id'],
                'invoiced_amount' => $half / 100,
                'reason' => 'Part ' . $attempt,
            ]));
        }

        $this->assertSame(2, Refund::where('order_id', $order['id'])->count());
    }

    /**
     * Two partial refunds that do not fit together record only the first.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_second_partial_refund_fails_when_both_do_not_fit(): void
    {
        $order = $this->create_order();
        $this->make_refundable($order['id']);
        $part = intdiv($this->refundable_minor($order['id']) * 6, 10);

        $this->assert_api_success($this->request('POST', 'orders/' . $order['id'] . '/refunds', [
            'order_id' => $order['id'],
            'invoiced_amount' => $part / 100,
            'reason' => 'First',
        ]));
        $this->assert_api_error($this->request('POST', 'orders/' . $order['id'] . '/refunds', [
            'order_id' => $order['id'],
            'invoiced_amount' => $part / 100,
            'reason' => 'Second',
        ]), 422);

        $this->assertSame(1, Refund::where('order_id', $order['id'])->count());
    }

    /**
     * A refund the payment gateway rejects leaves no refund record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_refund_rejected_by_the_gateway_leaves_no_refund(): void
    {
        $order = $this->create_order();
        $this->make_refundable($order['id']);
        Order::where('id', $order['id'])->update(['payment_provider' => 'paypal', 'payment_transaction_id' => 'CAPTURE-1']);
        $http_failure = fn() => new \WP_Error('http_request_failed', 'Gateway unreachable');
        add_filter('pre_http_request', $http_failure);

        try {
            $response = $this->request('POST', 'orders/' . $order['id'] . '/refunds', [
                'order_id' => $order['id'],
                'invoiced_amount' => 1,
                'reason' => 'Customer request',
            ]);
        } finally {
            remove_filter('pre_http_request', $http_failure);
        }

        $this->assertGreaterThanOrEqual(400, $response->get_status());
        $this->assertSame(0, Refund::where('order_id', $order['id'])->count());
        $this->assertNotSame(OrderStatus::REFUND_REQUESTED, Order::find($order['id'])->order_status);
    }

    /**
     * A cancel that loses the race changes no stock, coupon or status.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_cancel_that_loses_the_race_releases_stock_only_once(): void
    {
        $this->stock(10);
        $first = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 1]]]);
        $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 2]]]);
        $this->assertSame(3, (int) Variant::find($this->variant_id)->committed_quantity);

        $winner = app(OrderManager::class);
        $racing = new RacingOrderService();
        $racing->after_read = fn() => $winner->mark_as_cancel($first['id']);
        app()->instance(OrderService::class, $racing);
        static::forget_singleton(OrderManager::class);
        $loser = app(OrderManager::class);

        $this->assertFalse($loser->mark_as_cancel($first['id']));

        $variant = Variant::find($this->variant_id);
        $this->assertSame(2, (int) $variant->committed_quantity);
        $this->assertSame(8, (int) $variant->available_quantity);
        $this->assertSame(OrderStatus::UNPAID_CANCELLED, Order::find($first['id'])->order_status);
    }

    /**
     * A cancel request that arrives after another cancel finished is rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_cancel_action_that_waits_for_another_cancel_is_rejected(): void
    {
        $this->stock(10);
        $first = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 1]]]);
        $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 2]]]);

        $winner = app(OrderManager::class);
        $racing = new RacingOrderService();
        $racing->after_read = fn() => $winner->mark_as_cancel($first['id']);
        app()->instance(OrderService::class, $racing);

        $response = $this->request('PATCH', 'orders/' . $first['id'] . '/action', ['action' => OrderAction::CANCEL_ORDER]);

        // The winner ran inside this request's transaction here, so only the rejection is checked.
        $error = $this->assert_api_error($response, 422);
        $this->assertSame("This action is not available for the order's current status.", $error['message']);
    }

    /**
     * A cancel that loses the race gives back the coupon use only once.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_cancel_that_loses_the_race_reverses_the_coupon_use_only_once(): void
    {
        $coupon = $this->create_limited_coupon(['has_usage_limit' => true, 'usage_limit' => 5]);
        $first = $this->create_order(['coupon_codes' => [$coupon->code]]);
        $this->create_order(['coupon_codes' => [$coupon->code]]);
        $this->assertSame(2, (int) Coupon::find($coupon->id)->current_usage_count);

        $winner = app(OrderManager::class);
        $racing = new RacingOrderService();
        $racing->after_read = fn() => $winner->mark_as_cancel($first['id']);
        app()->instance(OrderService::class, $racing);
        static::forget_singleton(OrderManager::class);

        app(OrderManager::class)->mark_as_cancel($first['id']);

        $this->assertSame(1, (int) Coupon::find($coupon->id)->current_usage_count);
    }

    /**
     * A transition from a status the order already left is not applied.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_transition_is_not_applied_when_the_order_left_the_status(): void
    {
        $order = $this->create_order();
        $status_before = Order::find($order['id'])->order_status;
        Order::where('id', $order['id'])->update(['order_status' => OrderStatus::UNPAID_CANCELLED]);

        $is_applied = app(OrderService::class)->apply_order_action($order['id'], $status_before, OrderAction::MARK_AS_PROCESSING);

        $this->assertFalse($is_applied);
        $this->assertSame(OrderStatus::UNPAID_CANCELLED, Order::find($order['id'])->order_status);
    }

    /**
     * A mark-as-paid that loses the race confirms reserved stock only once.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mark_as_paid_that_loses_the_race_confirms_stock_only_once(): void
    {
        $this->stock(10);
        $first = $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 1]]]);
        $this->create_order(['items' => [['variant_id' => $this->variant_id, 'quantity' => 2]]]);
        Order::where('id', $first['id'])->update([
            'order_status' => OrderStatus::DELIVERED_UNPAID,
            'fulfillment_status' => FulfillmentStatus::DELIVERED,
            'payment_status' => PaymentStatus::UNPAID,
        ]);

        $winner = app(OrderManager::class);
        $racing = new RacingOrderService();
        $racing->after_read = fn() => $winner->mark_payment_as_paid($first['id']);
        app()->instance(OrderService::class, $racing);
        static::forget_singleton(OrderManager::class);

        $this->assertFalse(app(OrderManager::class)->mark_payment_as_paid($first['id']));

        $this->assertSame(2, (int) Variant::find($this->variant_id)->committed_quantity);
    }

    /**
     * An edit that works from stale items reserves only the real difference.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_edit_with_stale_items_reserves_only_the_real_difference(): void
    {
        $this->stock(10);
        $order = $this->create_order();
        $this->assertSame(1, (int) Variant::find($this->variant_id)->committed_quantity);

        $edit = fn() => $this->order_payload([
            'id' => $order['id'],
            'items' => [['id' => $order['items'][0]['id'] ?? null, 'variant_id' => $this->variant_id, 'quantity' => 3]],
        ]);

        $racing = new RacingOrderService();
        $racing->after_read = fn() => $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $edit()));
        app()->instance(OrderService::class, $racing);

        $this->assert_api_success($this->request('PUT', 'orders/' . $order['id'], $edit()));

        $variant = Variant::find($this->variant_id);
        $this->assertSame(3, (int) $variant->committed_quantity);
        $this->assertSame(7, (int) $variant->available_quantity);
    }

    /**
     * The first invoice number of a store is the configured starting sequence.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_first_invoice_number_is_the_starting_sequence(): void
    {
        $this->use_invoice_settings(['sequence' => '000100']);

        $this->assertSame('000100', OrderNumberGenerator::generate_invoice_number());
        $this->assertSame('000101', OrderNumberGenerator::generate_invoice_number());
    }

    /**
     * A counter row a competing first order created is counted on, never reset.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_invoice_counter_row_created_by_a_competitor_is_not_overwritten(): void
    {
        $this->use_invoice_settings(['sequence' => '000100']);

        // A competing first order created the row and took number 100 before this request seeded it.
        OptionModel::create(['option_name' => with_prefix(OptionKeys::LAST_INVOICE_NUMBER), 'option_value' => 100, 'autoload' => 'no']);

        $this->assertSame('000101', OrderNumberGenerator::generate_invoice_number());
    }

    /**
     * Every order gets a different invoice number.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_invoice_numbers_of_consecutive_orders_are_unique(): void
    {
        $this->use_invoice_settings([]);

        $numbers = [];

        foreach (range(1, 4) as $index) {
            $numbers[] = $this->create_order()['invoice_number'];
        }

        $this->assertSame($numbers, array_values(array_unique($numbers)));
    }

    /**
     * An order that fails and rolls back gives its invoice number back.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failed_order_leaves_no_gap_in_invoice_numbers(): void
    {
        $this->use_invoice_settings([]);
        $this->stock(1);

        $first = (int) $this->create_order()['invoice_number'];
        $failed = $this->request('POST', 'orders', $this->order_payload(['items' => [['variant_id' => $this->variant_id, 'quantity' => 5]]]));
        $this->assertGreaterThanOrEqual(400, $failed->get_status());
        $this->stock(10);

        $this->assertSame($first + 1, (int) $this->create_order()['invoice_number']);
    }

    /**
     * The first invoice after a year change resets the counter once.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_invoice_counter_resets_once_when_the_year_changes(): void
    {
        $this->use_invoice_settings(['sequence' => '000001', 'apply_year_prefix' => true, 'reset_sequence_every_year' => true]);
        $year = date('y') . '-';

        $this->assertSame($year . '000001', OrderNumberGenerator::generate_invoice_number());
        $this->assertSame($year . '000002', OrderNumberGenerator::generate_invoice_number());

        // Turn the stored reset year back: the next request is the first of a new year.
        OptionModel::query()->where('option_name', with_prefix(OptionKeys::LAST_INVOICE_NUMBER_RESET_YEAR))->update(['option_value' => (int) gmdate('Y') - 1]);
        Option::set(OptionKeys::LAST_INVOICE_NUMBER_RESET_YEAR, (int) gmdate('Y') - 1);

        $this->assertSame($year . '000001', OrderNumberGenerator::generate_invoice_number());
        $this->assertSame($year . '000002', OrderNumberGenerator::generate_invoice_number());
    }

    /**
     * A reset already done for the current year is not repeated by a later request.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_invoice_counter_is_not_reset_again_by_a_request_that_read_the_old_year(): void
    {
        $this->use_invoice_settings(['sequence' => '000001', 'apply_year_prefix' => true, 'reset_sequence_every_year' => true]);
        $year = date('y') . '-';
        OrderNumberGenerator::generate_invoice_number();
        OrderNumberGenerator::generate_invoice_number();

        // Another request already moved the stored year to the current one.
        Option::set(OptionKeys::LAST_INVOICE_NUMBER_RESET_YEAR, (int) gmdate('Y') - 1);
        OptionModel::query()->where('option_name', with_prefix(OptionKeys::LAST_INVOICE_NUMBER_RESET_YEAR))->update(['option_value' => (int) gmdate('Y')]);

        $this->assertSame($year . '000003', OrderNumberGenerator::generate_invoice_number());
    }

    /**
     * Apply invoice number settings that count from a fixed starting point.
     *
     * @param array<string, mixed> $overrides Setting overrides.
     * @return void
     * @since 1.0.0
     */
    protected function use_invoice_settings(array $overrides): void
    {
        // An earlier order in the run may have committed a counter row; start from a store with none.
        foreach ([OptionKeys::LAST_INVOICE_NUMBER, OptionKeys::LAST_INVOICE_NUMBER_RESET_YEAR] as $key) {
            OptionModel::query()->where('option_name', with_prefix($key))->delete();
        }
        wp_cache_flush();

        Settings::update('general.invoice_number', array_merge([
            'prefix' => '',
            'suffix' => '',
            'sequence' => '000001',
            'apply_year_prefix' => false,
            'reset_sequence_every_year' => false,
        ], $overrides));
    }

    /**
     * Put a tracked variant at a known available quantity with nothing committed.
     *
     * @param int $available_quantity Available quantity.
     * @return void
     * @since 1.0.0
     */
    protected function stock(int $available_quantity): void
    {
        Variant::find($this->variant_id)->update([
            'available_quantity' => $available_quantity,
            'committed_quantity' => 0,
            'track_inventory' => true,
            'allow_back_order' => false,
        ]);
    }

    /**
     * Build an inventory service that sees an earlier snapshot of a variant.
     *
     * @param Variant $snapshot Variant as read before the competing change.
     * @return InventoryService
     * @since 1.0.0
     */
    protected function inventory_over(Variant $snapshot): InventoryService
    {
        return new InventoryService(new StaleVariantService($snapshot), app(AvailabilityService::class));
    }

    /**
     * Resolve the inventory service.
     *
     * @return InventoryService
     * @since 1.0.0
     */
    protected function inventory(): InventoryService
    {
        return app(InventoryService::class);
    }

    /**
     * Create a free-shipping coupon with the given limits.
     *
     * @param array<string, mixed> $attributes Coupon attribute overrides.
     * @return Coupon
     * @since 1.0.0
     */
    protected function create_limited_coupon(array $attributes): Coupon
    {
        return Coupon::create(array_merge([
            'title' => 'Limited',
            'code' => 'LIMIT' . wp_generate_password(6, false),
            'discount_type' => DiscountType::FREE_SHIPPING,
            'eligible_item_type' => EligibleItemType::ALL_PRODUCTS,
            'is_active' => true,
        ], $attributes));
    }

    /**
     * Move an order into the state a refund is accepted from.
     *
     * @param int $order_id Order ID.
     * @return void
     * @since 1.0.0
     */
    protected function make_refundable(int $order_id): void
    {
        Order::where('id', $order_id)->update([
            'payment_status' => PaymentStatus::PAID,
            'fulfillment_status' => FulfillmentStatus::DELIVERED,
        ]);
    }

    /**
     * Get the minor-unit amount still refundable on an order with no refunds.
     *
     * @param int $order_id Order ID.
     * @return int
     * @since 1.0.0
     */
    protected function refundable_minor(int $order_id): int
    {
        $order = Order::find($order_id);

        return (int) ($order->invoiced_total - $order->invoiced_shipping_total);
    }

    /**
     * Place a manual order through the API.
     *
     * @param array<string, mixed> $overrides Payload overrides.
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function create_order(array $overrides = []): array
    {
        return $this->assert_api_success($this->request('POST', 'orders', $this->order_payload($overrides)), 201)['data'];
    }

    /**
     * Build a manual order payload for the current variant.
     *
     * @param array<string, mixed> $overrides Payload overrides.
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function order_payload(array $overrides = []): array
    {
        return array_merge([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 1]],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => true,
            'customer_first_name' => 'John',
            'customer_last_name' => 'Doe',
            'customer_email' => 'buyer@example.com',
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'New York',
            'shipping_state' => 'NY',
            'shipping_postal_code' => '10001',
            'shipping_country' => 'US',
            'billing_first_name' => 'John',
            'billing_last_name' => 'Doe',
            'billing_address_line1' => '123 Main St',
            'billing_city' => 'New York',
            'billing_state' => 'NY',
            'billing_postal_code' => '10001',
            'billing_country' => 'US',
        ], $overrides);
    }
}
