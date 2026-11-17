<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

/**
 * Covers the order list "attention" filter. Spec: order-list-filters (The order list filters by attention)
 * and home-attention (Needs your attention checks).
 */
class OrderAttentionFilterTest extends RestTestCase
{
    use SeedsAnalyticsData;

    /**
     * Start every test from an empty store.
     *
     * @return void
     * @since 1.0.2
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
    }

    /**
     * Create an order with a payment snapshot.
     *
     * @param string      $payment_status     Payment status.
     * @param string      $fulfillment_status Fulfillment status.
     * @param bool        $offline            Whether the payment method is offline.
     * @param string|null $created_at         Creation time in UTC, or null for now.
     * @param array       $more               Other order attributes.
     *
     * @return Order
     * @since 1.0.2
     */
    protected function attention_order(string $payment_status, string $fulfillment_status, bool $offline, ?string $created_at = null, array $more = []): Order
    {
        return $this->make_order(array_merge([
            'payment_status' => $payment_status,
            'fulfillment_status' => $fulfillment_status,
            'payment_metadata' => ['payment_provider' => ['id' => $offline ? 'bank' : 'paypal', 'name' => 'Method', 'icon' => null, 'is_offline' => $offline]],
        ], $more), [], null, $created_at);
    }

    /**
     * List the order IDs for an attention filter.
     *
     * @param string $attention Attention value.
     *
     * @return int[]
     * @since 1.0.2
     */
    protected function listed(string $attention): array
    {
        $payload = $this->assert_api_success($this->request('GET', 'orders', ['attention' => $attention, 'limit' => 50]));
        $ids = array_map('intval', array_column($payload['data']['results'], 'id'));
        sort($ids);

        return $ids;
    }

    /**
     * Scenario "Unpaid bank transfer order": it is in To ship and in To collect.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_unpaid_offline_order_is_to_ship_and_to_collect(): void
    {
        $order = $this->attention_order(PaymentStatus::UNPAID, FulfillmentStatus::UNFULFILLED, true);

        $this->assertSame([(int) $order->id], $this->listed('to_ship'));
        $this->assertSame([(int) $order->id], $this->listed('to_collect'));
    }

    /**
     * Scenario "Online payment not finished": it is in neither list.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_unpaid_online_order_is_in_neither_list(): void
    {
        $this->attention_order(PaymentStatus::UNPAID, FulfillmentStatus::UNFULFILLED, false);

        $this->assertSame([], $this->listed('to_ship'));
        $this->assertSame([], $this->listed('to_collect'));
    }

    /**
     * Paid orders that are unfulfilled or processing are to ship; shipped ones are not.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_paid_orders_to_ship(): void
    {
        $unfulfilled = $this->attention_order(PaymentStatus::PAID, FulfillmentStatus::UNFULFILLED, false);
        $processing = $this->attention_order(PaymentStatus::PAID, FulfillmentStatus::PROCESSING, false);
        $this->attention_order(PaymentStatus::PAID, FulfillmentStatus::SHIPPED, false);

        $this->assertSame([(int) $unfulfilled->id, (int) $processing->id], $this->listed('to_ship'));
        $this->assertSame([], $this->listed('to_collect'));
    }

    /**
     * Scenario "Old failed payment": a failed payment counts for 7 days only.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_failed_payments_count_for_7_days(): void
    {
        $recent = $this->attention_order(PaymentStatus::FAILED, FulfillmentStatus::UNFULFILLED, false, Date::now('UTC')->sub_days(2)->to_date_time_string());
        $this->attention_order(PaymentStatus::FAILED, FulfillmentStatus::UNFULFILLED, false, Date::now('UTC')->sub_days(8)->to_date_time_string());

        $this->assertSame([(int) $recent->id], $this->listed('to_collect'));
        $this->assertSame([], $this->listed('to_ship'));
    }

    /**
     * Scenario "Archived order", and a cancelled unpaid offline order is not to collect.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_archived_and_cancelled_orders_are_left_out(): void
    {
        $this->attention_order(PaymentStatus::PAID, FulfillmentStatus::UNFULFILLED, false, null, ['archived_at' => Date::now('UTC')->to_date_time_string()]);
        $this->attention_order(PaymentStatus::UNPAID, FulfillmentStatus::CANCELLED, true);

        $this->assertSame([], $this->listed('to_ship'));
        $this->assertSame([], $this->listed('to_collect'));
    }

    /**
     * Scenario "Unknown value": the request is rejected on attention.
     *
     * @return void
     * @since 1.0.2
     */
    public function test_unknown_attention_value_is_rejected(): void
    {
        $payload = $this->assert_api_error($this->request('GET', 'orders', ['attention' => 'late']), 422);

        $this->assertArrayHasKey('attention', $payload['errors']);
    }
}
