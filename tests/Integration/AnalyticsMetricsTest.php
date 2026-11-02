<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderTaxType;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\OrderTax;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 4.1 for metrics: every metric formula, name resolution, customers, inventory, currency and freshness.
 *
 * Today is frozen at 2026-10-14. Spec: analytics-metrics.
 */
class AnalyticsMetricsTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsAnalyticsData;

    /**
     * Start every test from an empty store.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
        Variant::query()->delete();
    }

    /**
     * Drop a faked queue manager if a test created one.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        static::forget_singleton(QueueManager::class);

        parent::tearDown();
    }

    /**
     * Get the regions of one country for one custom day range with no comparison.
     *
     * @param string $country Country code.
     * @param string $from    First day, Y-m-d.
     * @param string $to      Last day, Y-m-d.
     *
     * @return array
     * @since 1.0.0
     */
    protected function regions_between(string $country, string $from, string $to): array
    {
        $params = ['country' => $country, 'range' => 'custom', 'from' => $from, 'to' => $to, 'compare' => 'none'];

        return $this->assert_api_success($this->request('GET', 'analytics/regions', $params))['data'];
    }

    /**
     * Create the tax-exclusive worked example order from the spec, paid on a given day.
     *
     * @param string $paid_at Payment time, UTC.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function tax_exclusive_order(string $paid_at = '2026-10-01 10:00:00'): Order
    {
        return $this->make_order([
            'base_subtotal' => 6200,
            'invoiced_subtotal' => 6200,
            'base_shipping_total' => 880,
            'invoiced_shipping_total' => 880,
            'base_shipping_tax_amount' => 80,
            'invoiced_shipping_tax_amount' => 80,
            'base_tax_total' => 601,
            'invoiced_tax_total' => 601,
            'base_total' => 6601,
            'invoiced_total' => 6601,
            'items_count' => 2,
        ], [
            ['quantity' => 1, 'base_subtotal' => 5000, 'base_total' => 4516, 'base_tax_total' => 411, 'invoiced_subtotal' => 5000, 'invoiced_total' => 4516, 'invoiced_tax_total' => 411],
            ['quantity' => 1, 'base_subtotal' => 1200, 'base_total' => 1205, 'base_tax_total' => 110, 'invoiced_subtotal' => 1200, 'invoiced_total' => 1205, 'invoiced_tax_total' => 110],
        ], $paid_at, $paid_at);
    }

    /**
     * Scenario "Large totals do not drift": 3 orders of 1001 add up to 3003, shown as 30.03.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_large_totals_do_not_drift(): void
    {
        foreach (['2026-10-01', '2026-10-02', '2026-10-03'] as $day) {
            $this->make_sale($day . ' 10:00:00', 1001);
        }

        $data = $this->overview_between('2026-10-01', '2026-10-14');
        $total = $data['cards']['total_sales_over_time']['total']['current_money_object'];

        $this->assertSame(3003, $this->minor($total));
        $this->assertEqualsWithDelta(30.03, $total['raw'], 0.0001);
        $this->assertStringContainsString('30.03', $total['display']);
        $this->assertSame($total['display'], $total['short_display']);
    }

    /**
     * Scenario "Tax-exclusive worked example": every sales metric, through the endpoint.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_exclusive_worked_example(): void
    {
        $this->tax_exclusive_order();

        $data = $this->overview_between('2026-10-01', '2026-10-01');

        $this->assertSame(6200, $this->breakdown_minor($data, 'gross_sales'));
        $this->assertSame(1000, $this->breakdown_minor($data, 'discounts'));
        $this->assertSame(0, $this->breakdown_minor($data, 'returns'));
        $this->assertSame(5200, $this->breakdown_minor($data, 'net_sales'));
        $this->assertSame(800, $this->breakdown_minor($data, 'shipping'));
        $this->assertSame(601, $this->breakdown_minor($data, 'taxes'));
        $this->assertSame(6601, $this->breakdown_minor($data, 'total_sales'));
        $this->assertSame(5200, $this->minor($data['kpis']['average_order_value']['current_money_object']));
        $this->assertSame(6200, $this->minor($data['kpis']['gross_sales']['current_money_object']));
    }

    /**
     * Scenario "Tax-inclusive worked example".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_inclusive_worked_example(): void
    {
        $this->make_order([
            'is_tax_inclusive' => true,
            'base_subtotal' => 1000,
            'invoiced_subtotal' => 1000,
            'base_discount_total' => 110,
            'base_tax_total' => 90,
            'invoiced_tax_total' => 90,
            'base_total' => 990,
            'invoiced_total' => 990,
            'items_count' => 1,
        ], [[
            'quantity' => 1,
            'base_subtotal' => 1000,
            'invoiced_subtotal' => 1000,
            'base_discount_amount' => 110,
            'base_tax_total' => 90,
            'invoiced_tax_total' => 90,
            'base_total' => 990,
            'invoiced_total' => 990,
        ]], '2026-10-01 10:00:00', '2026-10-01 10:00:00');

        $data = $this->overview_between('2026-10-01', '2026-10-01');

        $this->assertSame(1000, $this->breakdown_minor($data, 'gross_sales'));
        $this->assertSame(100, $this->breakdown_minor($data, 'discounts'));
        $this->assertSame(900, $this->breakdown_minor($data, 'net_sales'));
        $this->assertSame(90, $this->breakdown_minor($data, 'taxes'));
        $this->assertSame(990, $this->breakdown_minor($data, 'total_sales'));
    }

    /**
     * Scenario "Free shipping": Shipping charges is 0 and Discounts does not include the 800.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_free_shipping_is_not_a_discount(): void
    {
        $this->make_free_shipping_order('2026-10-01 10:00:00');

        $data = $this->overview_between('2026-10-01', '2026-10-01');

        $this->assertSame(0, $this->breakdown_minor($data, 'shipping'));
        $this->assertSame(0, $this->breakdown_minor($data, 'discounts'));
        $this->assertSame(5000, $this->breakdown_minor($data, 'total_sales'));
    }

    /**
     * Scenario "Free-shipping code": FREESHIP50 shows 4 orders and 3200 discount given.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_free_shipping_code_in_the_coupon_card(): void
    {
        for ($index = 0; $index < 4; $index++) {
            $this->make_free_shipping_order('2026-10-0' . ($index + 1) . ' 10:00:00');
        }

        $items = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_coupon_code']['items'];

        $this->assertCount(1, $items);
        $this->assertSame('FREESHIP50', $items[0]['code']);
        $this->assertSame(4, $items[0]['orders']);
        $this->assertSame(3200, $this->minor($items[0]['discount_given_money_object']));
    }

    /**
     * Scenario "Coupon growth": a code row has the change of its orders.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_coupon_code_has_the_change_of_its_orders(): void
    {
        $this->make_free_shipping_order('2026-09-30 10:00:00');
        $this->make_free_shipping_order('2026-10-01 09:00:00');
        $this->make_free_shipping_order('2026-10-01 10:00:00');

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['sales_by_coupon_code']['items'];

        $this->assertSame(2, $items[0]['orders']);
        $this->assertSame(1, $items[0]['previous_orders']);
        $this->assertSame(100.0, (float) $items[0]['change']);
    }

    /**
     * Scenario "Order late in the evening in a positive offset zone": in Asia/Dhaka, 20:30 UTC on a Thursday is Friday at hour 2.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_time_of_day_uses_the_site_time_zone(): void
    {
        $this->set_timezone('Asia/Dhaka');
        $this->make_sale('2026-10-01 20:30:00', 1000);

        $card = $this->overview_between('2026-10-01', '2026-10-07')['cards']['orders_by_time_of_day'];

        $this->assertSame(1, $card['current'][4][2]);
        $this->assertSame(1, array_sum(array_map('array_sum', $card['current'])));
        $this->assertNull($card['previous']);
    }

    /**
     * Scenario "Half-hour offset": in Asia/Kolkata, 12:45 UTC on a Monday is Monday at hour 18.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_time_of_day_uses_a_half_hour_offset(): void
    {
        $this->set_timezone('Asia/Kolkata');
        $this->make_sale('2026-10-05 12:45:00', 1000);

        $card = $this->overview_between('2026-10-05', '2026-10-05')['cards']['orders_by_time_of_day'];

        $this->assertSame(1, $card['current'][0][18]);
    }

    /**
     * Scenario "Failed order": a failed order counts in no weekday or hour.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_time_of_day_leaves_out_failed_orders(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000, ['payment_status' => PaymentStatus::FAILED]);

        $card = $this->overview_between('2026-10-01', '2026-10-01')['cards']['orders_by_time_of_day'];

        $this->assertSame(0, array_sum(array_map('array_sum', $card['current'])));
    }

    /**
     * Scenario "Comparison counts": an order on a Wednesday at 9:10 in the comparison period counts at Wednesday hour 9.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_time_of_day_has_the_comparison_counts(): void
    {
        $this->make_sale('2026-09-30 09:10:00', 1000);
        $this->make_sale('2026-10-01 11:00:00', 1000);

        $card = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['orders_by_time_of_day'];

        $this->assertSame(1, $card['current'][3][11]);
        $this->assertSame(1, $card['previous'][2][9]);
    }

    /**
     * Scenario "Shipping address wins": an order billed to Canada and shipped to Texas counts under the United States and Texas.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_location_uses_the_shipping_address(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000, [
            'billing_country' => 'CA',
            'billing_state' => 'ON',
            'shipping_country' => 'US',
            'shipping_state' => 'TX',
        ]);

        $countries = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_location']['countries'];
        $regions = $this->regions_between('US', '2026-10-01', '2026-10-14');

        $this->assertSame(['US'], array_column($countries, 'code'));
        $this->assertSame('840', $countries[0]['numeric_code']);
        $this->assertSame('United States', $countries[0]['name']);
        $this->assertSame(1000, $this->minor($countries[0]['sales_money_object']));
        $this->assertSame(1, $countries[0]['orders']);
        $this->assertSame(1, $countries[0]['customers']);
        $this->assertNull($countries[0]['sales_change']);
        $this->assertSame(['Texas'], array_column($regions['sales'], 'name'));
    }

    /**
     * Scenario "No shipping address": an order with no shipping country counts under its billing country and state.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_location_falls_back_to_the_billing_address(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000, ['billing_country' => 'CA', 'billing_state' => 'Ontario']);

        $countries = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_location']['countries'];
        $regions = $this->regions_between('CA', '2026-10-01', '2026-10-14');

        $this->assertSame(['CA'], array_column($countries, 'code'));
        $this->assertSame(['Ontario'], array_column($regions['orders'], 'name'));
    }

    /**
     * Scenario "No country at all": an order with no country is in no location, but Orders still counts it.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_without_a_country_is_in_no_location(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000);

        $data = $this->overview_between('2026-10-01', '2026-10-14');

        $this->assertSame([], $data['cards']['sales_by_location']['countries']);
        $this->assertSame(1, $data['kpis']['orders']['current']);
    }

    /**
     * Scenario "Placed but not paid": an unpaid order counts in Orders only.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unpaid_order_counts_only_in_location_orders(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000, ['payment_status' => PaymentStatus::UNPAID, 'shipping_country' => 'DE']);
        Order::query()->update(['paid_at' => null]);

        $countries = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_location']['countries'];

        $this->assertSame('DE', $countries[0]['code']);
        $this->assertSame(1, $countries[0]['orders']);
        $this->assertSame(0, $this->minor($countries[0]['sales_money_object']));
        $this->assertSame(0, $countries[0]['customers']);
    }

    /**
     * Scenario "One customer, two orders": Australia has 2 orders and 1 customer.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_location_counts_a_customer_once(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000, ['customer_email' => 'mia@example.com', 'shipping_country' => 'AU']);
        $this->make_sale('2026-10-02 10:00:00', 1000, ['customer_email' => 'mia@example.com', 'shipping_country' => 'AU']);

        $countries = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_location']['countries'];

        $this->assertSame(2, $countries[0]['orders']);
        $this->assertSame(1, $countries[0]['customers']);
    }

    /**
     * Scenario "Country change": Germany has Net sales 5672.15 and 2686.00 before, so its Sales change is 111.2.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_location_has_the_change_of_each_metric(): void
    {
        $this->make_sale('2026-09-30 10:00:00', 268600, ['shipping_country' => 'DE']);
        $this->make_sale('2026-10-01 10:00:00', 567215, ['shipping_country' => 'DE']);

        $countries = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['sales_by_location']['countries'];

        $this->assertSame(111.2, (float) $countries[0]['sales_change']);
        $this->assertNotNull($countries[0]['orders_change']);
        $this->assertSame(0.0, (float) $countries[0]['orders_change']);
    }

    /**
     * Scenario "Empty state": orders of a country with no state group into one "Unknown region" row.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_orders_without_a_state_are_an_unknown_region(): void
    {
        foreach (['2026-10-01 10:00:00', '2026-10-02 10:00:00', '2026-10-03 10:00:00'] as $paid_at) {
            $this->make_sale($paid_at, 1000, ['shipping_country' => 'US']);
        }

        $regions = $this->regions_between('US', '2026-10-01', '2026-10-14');

        $this->assertSame('US', $regions['country']);
        $this->assertSame('Unknown region', $regions['orders'][0]['name']);
        $this->assertSame(3, $regions['orders'][0]['orders']);
    }

    /**
     * Scenario "Three lists in one response": the top 5 regions by each metric, in their own order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_regions_have_the_top_five_for_each_metric(): void
    {
        $states = ['CA' => 9000, 'NY' => 8000, 'TX' => 7000, 'FL' => 6000, 'IL' => 5000, 'WA' => 4000];

        foreach ($states as $state => $subtotal) {
            $this->make_sale('2026-10-01 10:00:00', $subtotal, ['shipping_country' => 'US', 'shipping_state' => $state]);
        }

        $this->make_sale('2026-10-02 10:00:00', 100, ['shipping_country' => 'US', 'shipping_state' => 'WA']);
        $this->make_sale('2026-10-03 10:00:00', 100, ['shipping_country' => 'US', 'shipping_state' => 'WA']);

        $regions = $this->regions_between('US', '2026-10-01', '2026-10-14');

        $this->assertSame(['California', 'New York', 'Texas', 'Florida', 'Illinois'], array_column($regions['sales'], 'name'));
        $this->assertArrayHasKey('short_display', $regions['sales'][0]['sales_money_object']);
        $this->assertSame('Washington', $regions['orders'][0]['name']);
        $this->assertSame(3, $regions['orders'][0]['orders']);
        $this->assertCount(5, $regions['customers']);
    }

    /**
     * Scenario "No sales": Average order value is empty, not zero.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_average_order_value_is_empty_without_sales(): void
    {
        $data = $this->overview_between('2026-10-01', '2026-10-14');

        $this->assertNull($data['kpis']['average_order_value']['current_money_object']);
        $this->assertNull($data['cards']['average_order_value_over_time']['total']['current_money_object']);
    }

    /**
     * Money is added up in minor units: Average order value is rounded half up after the division.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_average_order_value_is_rounded_half_up(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1001);
        $this->make_sale('2026-10-01 11:00:00', 1000);

        $data = $this->overview_between('2026-10-01', '2026-10-01');

        // 2001 / 2 = 1000.5 -> 1001
        $this->assertSame(1001, $this->minor($data['kpis']['average_order_value']['current_money_object']));
    }

    /**
     * Scenario "Cash on delivery paid later": a sale on Oct 5 and not on Oct 1.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_cash_on_delivery_paid_later_counts_on_the_paid_day(): void
    {
        $this->make_order(['base_subtotal' => 2000, 'base_total' => 2000, 'invoiced_subtotal' => 2000, 'invoiced_total' => 2000], [
            ['base_subtotal' => 2000, 'base_total' => 2000, 'invoiced_subtotal' => 2000, 'invoiced_total' => 2000],
        ], '2026-10-05 10:00:00', '2026-10-01 10:00:00');

        $first_day = $this->overview_between('2026-10-01', '2026-10-01');
        $paid_day = $this->overview_between('2026-10-05', '2026-10-05');

        $this->assertSame(0, $this->minor($first_day['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(2000, $this->minor($paid_day['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(1, $first_day['kpis']['orders']['current']);
        $this->assertSame(0, $paid_day['kpis']['orders']['current']);
    }

    /**
     * Scenario "Unpaid order counts as placed": an unpaid order counts in Orders on Oct 1 and not in Gross sales.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unpaid_order_counts_in_orders(): void
    {
        $this->make_order(['payment_status' => PaymentStatus::UNPAID, 'base_subtotal' => 900, 'base_total' => 900], [
            ['base_subtotal' => 900, 'base_total' => 900],
        ], null, '2026-10-01 10:00:00');

        $data = $this->overview_between('2026-10-01', '2026-10-01');

        $this->assertSame(1, $data['kpis']['orders']['current']);
        $this->assertSame(0, $this->minor($data['kpis']['gross_sales']['current_money_object']));
        $this->assertTrue($data['has_orders']);
    }

    /**
     * Data for failed orders: every fulfillment status.
     *
     * @return array
     * @since 1.0.0
     */
    public function fulfillment_statuses(): array
    {
        return [
            'unfulfilled' => [FulfillmentStatus::UNFULFILLED],
            'processing' => [FulfillmentStatus::PROCESSING],
            'shipped' => [FulfillmentStatus::SHIPPED],
            'delivered' => [FulfillmentStatus::DELIVERED],
            'on-hold' => [FulfillmentStatus::ON_HOLD],
            'cancelled' => [FulfillmentStatus::CANCELLED],
            'returned' => [FulfillmentStatus::RETURNED],
        ];
    }

    /**
     * Scenario "Failed order that is being shipped": a failed order is not in Orders, Items ordered or the fulfillment card, whatever its fulfillment status.
     *
     * @dataProvider fulfillment_statuses
     *
     * @param string $fulfillment_status Fulfillment status.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failed_order_is_not_counted_for_any_fulfillment_status(string $fulfillment_status): void
    {
        $this->make_order([
            'payment_status' => PaymentStatus::FAILED,
            'fulfillment_status' => $fulfillment_status,
            'items_count' => 3,
        ], [['quantity' => 3]], null, '2026-10-01 10:00:00');

        $data = $this->overview_between('2026-10-01', '2026-10-01');

        $this->assertSame(0, $data['kpis']['orders']['current']);
        $this->assertSame(0, $data['cards']['orders_over_time']['items_ordered']);
        $this->assertSame(0, $data['cards']['orders_by_fulfillment_status']['total_orders']);
        $this->assertSame(0, $this->minor($data['kpis']['gross_sales']['current_money_object']));
    }

    /**
     * Placed order metrics: Items ordered is the sum of items_count of placed orders by created date.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_items_ordered_sums_items_of_placed_orders(): void
    {
        $this->make_order(['payment_status' => PaymentStatus::UNPAID, 'items_count' => 2], [], null, '2026-10-01 10:00:00');
        $this->make_sale('2026-10-02 10:00:00', 1000, [], 3);

        $data = $this->overview_between('2026-10-01', '2026-10-14');

        $this->assertSame(2, $data['kpis']['orders']['current']);
        $this->assertSame(5, $data['cards']['orders_over_time']['items_ordered']);
    }

    /**
     * Scenario "Items ordered series": the key metric sums items_count, and each chart point sums its day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_items_ordered_key_metric_has_a_series_by_day(): void
    {
        $this->make_order(['payment_status' => PaymentStatus::UNPAID, 'items_count' => 3], [], null, '2026-09-03 10:00:00');
        $this->make_order(['payment_status' => PaymentStatus::UNPAID, 'items_count' => 2], [], null, '2026-09-03 11:00:00');
        $this->make_order(['payment_status' => PaymentStatus::UNPAID, 'items_count' => 4], [], null, '2026-09-04 10:00:00');

        $items_ordered = $this->overview_between('2026-09-03', '2026-09-04')['kpis']['items_ordered'];

        $this->assertSame(9, $items_ordered['current']);
        $this->assertSame([5, 4], array_column($items_ordered['series'], 'value'));
    }

    /**
     * Scenario "Returned order": a placed order with fulfillment status returned counts under Returned.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_returned_order_counts_under_returned(): void
    {
        $this->make_order([
            'payment_status' => PaymentStatus::REFUNDED,
            'fulfillment_status' => FulfillmentStatus::RETURNED,
        ], [], '2026-09-03 10:00:00', '2026-09-03 10:00:00');
        $this->make_order(['fulfillment_status' => FulfillmentStatus::DELIVERED], [], '2026-09-04 10:00:00', '2026-09-04 10:00:00');

        $card = $this->overview_between('2026-09-01', '2026-09-30')['cards']['orders_by_fulfillment_status'];
        $by_status = array_column($card['items'], null, 'status');

        $this->assertSame(2, $card['total_orders']);
        $this->assertSame(1, $by_status['returned']['count']);
        $this->assertSame(1, $by_status['delivered']['count']);
        $this->assertEqualsWithDelta(50.0, $by_status['returned']['percent'], 0.05);
        $this->assertEqualsWithDelta(50.0, $card['delivered_percent'], 0.05);
        $this->assertSame(0, $by_status['shipped']['count']);
    }

    /**
     * Scenario "Fully refunded order keeps its sale": Gross sales on Sep 3, Returns on Sep 20.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_fully_refunded_order_keeps_its_sale_and_shows_returns_on_the_refund_day(): void
    {
        $order = $this->make_sale('2026-09-03 10:00:00', 4000, ['payment_status' => PaymentStatus::REFUNDED]);
        $this->make_refund($order, 4000, RefundStatus::COMPLETED, '2026-09-20 10:00:00');

        $paid_day = $this->overview_between('2026-09-03', '2026-09-03');
        $refund_day = $this->overview_between('2026-09-20', '2026-09-20');

        $this->assertSame(4000, $this->breakdown_minor($paid_day, 'gross_sales'));
        $this->assertSame(0, $this->breakdown_minor($paid_day, 'returns'));
        $this->assertSame(0, $this->breakdown_minor($refund_day, 'gross_sales'));
        $this->assertSame(4000, $this->breakdown_minor($refund_day, 'returns'));
        $this->assertSame(-4000, $this->breakdown_minor($refund_day, 'net_sales'));
    }

    /**
     * Scenario "Partial refund": Returns on Sep 20 is 2000, and Gross sales on Sep 3 does not change.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_partial_refund_is_converted_by_the_order_ratio(): void
    {
        $order = $this->make_sale('2026-09-03 10:00:00', 10000, ['invoiced_total' => 9000, 'invoiced_subtotal' => 9000]);
        $this->make_refund($order, 1800, RefundStatus::COMPLETED, '2026-09-20 10:00:00');

        $paid_day = $this->overview_between('2026-09-03', '2026-09-03');
        $refund_day = $this->overview_between('2026-09-20', '2026-09-20');

        $this->assertSame(10000, $this->breakdown_minor($paid_day, 'gross_sales'));
        $this->assertSame(2000, $this->breakdown_minor($refund_day, 'returns'));
    }

    /**
     * Scenario "Pending refund": pending and cancelled refunds are not in Returns.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_pending_and_cancelled_refunds_are_not_returns(): void
    {
        $order = $this->make_sale('2026-09-03 10:00:00', 10000, ['invoiced_total' => 10000]);
        $this->make_refund($order, 500, RefundStatus::PENDING, '2026-09-20 10:00:00');
        $this->make_refund($order, 700, RefundStatus::CANCELLED, '2026-09-20 10:00:00');

        $data = $this->overview_between('2026-09-01', '2026-09-30');

        $this->assertSame(0, $this->breakdown_minor($data, 'returns'));
    }

    /**
     * Scenario "Old base currency": an order in another base currency is left out of every metric.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_in_an_old_base_currency_is_left_out(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 7000, ['currency_code' => 'EUR', 'base_currency_code' => 'EUR']);

        $data = $this->overview_between('2026-10-01', '2026-10-14');

        $this->assertFalse($data['has_orders']);
        $this->assertSame(0, $this->minor($data['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(0, $data['kpis']['orders']['current']);
        $this->assertSame(0, $data['cards']['orders_by_fulfillment_status']['total_orders']);
        $this->assertSame([], $data['cards']['sales_by_product']['items']);
    }

    /**
     * Scenario "Late order in a positive offset zone": the order is a sale on Oct 2 in Asia/Dhaka.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_late_order_in_dhaka_is_a_sale_on_the_next_day(): void
    {
        $this->set_timezone('Asia/Dhaka');
        $this->make_sale('2026-10-01 20:30:00', 1000);

        $oct_1 = $this->overview_between('2026-10-01', '2026-10-01');
        $oct_2 = $this->overview_between('2026-10-02', '2026-10-02');

        $this->assertSame(0, $this->minor($oct_1['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(1000, $this->minor($oct_2['kpis']['gross_sales']['current_money_object']));
    }

    /**
     * Scenario "Browser time zone header": with the site in UTC, the header puts the order on its Asia/Dhaka day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_time_zone_header_puts_the_order_on_the_browser_day(): void
    {
        $this->set_timezone('UTC');
        $this->make_sale('2026-10-01 20:30:00', 1000);

        $this->assertSame(0, $this->gross_sales_on('2026-10-01', 'Asia/Dhaka'));
        $this->assertSame(1000, $this->gross_sales_on('2026-10-02', 'Asia/Dhaka'));
    }

    /**
     * Scenario "Invalid time zone header": an unknown time zone in the header falls back to the site time zone.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_invalid_time_zone_header_uses_the_site_time_zone(): void
    {
        $this->set_timezone('Asia/Dhaka');
        $this->make_sale('2026-10-01 20:30:00', 1000);

        $this->assertSame(0, $this->gross_sales_on('2026-10-01', 'Mars/Base'));
        $this->assertSame(1000, $this->gross_sales_on('2026-10-02', 'Mars/Base'));
    }

    /**
     * Get the gross sales of one day, in minor units, for a request with the given time zone header.
     *
     * @param string $day      Day, Y-m-d.
     * @param string $timezone Value of the `X-Kecom-Timezone` header.
     *
     * @return int|null
     * @since 1.0.0
     */
    protected function gross_sales_on(string $day, string $timezone): ?int
    {
        $response = $this->request('GET', 'analytics/metrics/kpis', [
            'range' => 'custom',
            'from' => $day,
            'to' => $day,
            'compare' => 'none',
        ], ['X-Kecom-Timezone' => $timezone]);

        return $this->minor($this->assert_api_success($response)['data']['data']['gross_sales']['current_money_object']);
    }

    /**
     * Scenario "Currency parameter is ignored": a currency parameter does not filter orders, and every amount is in the base currency.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_currency_parameter_is_ignored(): void
    {
        if (!Currency::query()->where('code', 'EUR')->exists()) {
            Currency::create(['code' => 'EUR', 'name' => 'Euro', 'symbol' => 'EUR ', 'exchange_rate' => 0.9, 'is_base' => false, 'is_active' => true]);
        }

        $this->make_sale('2026-10-01 10:00:00', 10000);
        $eur_order = $this->make_order([
            'currency_code' => 'EUR',
            'base_subtotal' => 10000,
            'invoiced_subtotal' => 9000,
            'base_total' => 10000,
            'invoiced_total' => 9000,
            'items_count' => 1,
        ], [[
            'base_subtotal' => 10000,
            'invoiced_subtotal' => 9000,
            'base_total' => 10000,
            'invoiced_total' => 9000,
        ]], '2026-10-02 10:00:00', '2026-10-02 10:00:00');
        $this->make_refund($eur_order, 1800, RefundStatus::COMPLETED, '2026-10-03 10:00:00');

        $all = $this->overview_between('2026-10-01', '2026-10-14');
        $eur = $this->overview_between('2026-10-01', '2026-10-14', ['currency' => 'EUR']);

        $this->assertSame(20000, $this->minor($all['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(2000, $this->breakdown_minor($all, 'returns'));
        $this->assertSame(2, $all['kpis']['orders']['current']);
        $this->assertSame('USD', $all['base_currency_code']);
        $this->assertArrayNotHasKey('currencies', $all);

        $this->assertSame($all['kpis'], $eur['kpis']);
        $this->assertSame($all['cards'], $eur['cards']);
        $this->assertSame('USD', $eur['kpis']['gross_sales']['current_money_object']['currency']['code']);
    }

    /**
     * Scenario "Product in two categories": both categories show the product's Net sales.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_in_two_categories_counts_in_both(): void
    {
        $hoodies = $this->create_category('Hoodies');
        $sale = $this->create_category('Sale');
        $product_id = $this->create_product(['categories' => [$hoodies, $sale]])['id'];
        $this->make_sale_with_item('2026-10-01 10:00:00', ['product_id' => $product_id, 'base_subtotal' => 3000, 'base_total' => 3000]);

        $items = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_category']['items'];
        $by_name = array_column($items, null, 'name');

        $this->assertSame(3000, $this->minor($by_name['Hoodies']['net_sales_money_object']));
        $this->assertSame(3000, $this->minor($by_name['Sale']['net_sales_money_object']));
        $this->assertSame($hoodies, $by_name['Hoodies']['category_id']);
    }

    /**
     * Scenario "Category growth": a category row has the change of its Net sales.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_category_has_the_change_of_its_net_sales(): void
    {
        $hoodies = $this->create_category('Hoodies');
        $product_id = $this->create_product(['categories' => [$hoodies]])['id'];
        $this->make_sale_with_item('2026-09-30 10:00:00', ['product_id' => $product_id, 'base_subtotal' => 2000, 'base_total' => 2000]);
        $this->make_sale_with_item('2026-10-01 10:00:00', ['product_id' => $product_id, 'base_subtotal' => 3000, 'base_total' => 3000]);

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['sales_by_category']['items'];

        $this->assertSame(2000, $this->minor($items[0]['previous_net_sales_money_object']));
        $this->assertSame(50.0, (float) $items[0]['change']);
    }

    /**
     * Product sales metrics: a product in no category counts under "Uncategorized".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_without_a_category_is_uncategorized(): void
    {
        $product_id = $this->create_product()['id'];
        $this->make_sale_with_item('2026-10-01 10:00:00', ['product_id' => $product_id, 'base_subtotal' => 500, 'base_total' => 500]);

        $items = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_category']['items'];

        $this->assertCount(1, $items);
        $this->assertSame('Uncategorized', $items[0]['name']);
        $this->assertNull($items[0]['category_id']);
        $this->assertSame(500, $this->minor($items[0]['net_sales_money_object']));
    }

    /**
     * Scenario "Deleted product": the item is grouped under its saved name and marked as deleted.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_deleted_product_is_grouped_by_its_saved_name(): void
    {
        $this->make_sale_with_item('2026-10-01 10:00:00', ['product_id' => null, 'product_name' => 'Retired mug', 'quantity' => 2, 'base_subtotal' => 1000, 'base_total' => 1000]);

        $items = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_product']['items'];

        $this->assertCount(1, $items);
        $this->assertSame('Retired mug', $items[0]['name']);
        $this->assertTrue($items[0]['is_deleted']);
        $this->assertNull($items[0]['product_id']);
        $this->assertSame(2, $items[0]['units_sold']);
        $this->assertSame(1000, $this->minor($items[0]['net_sales_money_object']));
    }

    /**
     * Product sales metrics: the top products are ranked by Net sales (without tax, after discounts), limited to five, and do not subtract Returns.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_top_products_rank_by_net_sales_and_ignore_returns(): void
    {
        $order = null;
        for ($index = 1; $index <= 6; $index++) {
            $order = $this->make_sale_with_item('2026-10-01 10:00:00', [
                'product_id' => null,
                'product_name' => 'Item ' . $index,
                'base_subtotal' => $index * 1000,
                'base_total' => $index * 1100,
                'base_tax_total' => $index * 100,
            ]);
        }
        $this->make_refund($order, 6000, RefundStatus::COMPLETED, '2026-10-02 10:00:00');

        $items = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_product']['items'];

        $this->assertSame(['Item 6', 'Item 5', 'Item 4', 'Item 3', 'Item 2'], array_column($items, 'name'));
        $this->assertSame(6000, $this->minor($items[0]['net_sales_money_object']));
    }

    /**
     * Scenario "Stock badge in Sales by product" (data side): the product stock is the sum of positive tracked quantities.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_stock_is_the_sum_of_non_negative_tracked_quantities(): void
    {
        Settings::get('product')->set(['low_stock_threshold' => 5], false);
        $product_id = $this->create_product()['id'];
        Variant::query()->where('product_id', $product_id)->update(['track_inventory' => false]);
        $this->make_variant($product_id, ['available_quantity' => 3]);
        $this->make_variant($product_id, ['available_quantity' => -1, 'allow_back_order' => true]);
        $this->make_sale_with_item('2026-10-01 10:00:00', ['product_id' => $product_id, 'base_subtotal' => 1000, 'base_total' => 1000]);

        $item = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_product']['items'][0];

        $this->assertTrue($item['track_inventory']);
        $this->assertSame(3, $item['inventory']);
    }

    /**
     * Scenario "Uninstalled gateway": the method shows the name saved in the order's payment metadata.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_uninstalled_payment_gateway_uses_the_saved_name(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 2500, [
            'payment_provider' => 'ghost_pay',
            'payment_metadata' => ['payment_provider' => ['name' => 'Ghost Pay']],
        ]);
        $this->make_sale('2026-10-02 10:00:00', 1500, ['payment_provider' => 'unknown_pay']);

        $items = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_payment_method']['items'];
        $by_id = array_column($items, null, 'id');

        $this->assertSame('Ghost Pay', $by_id['ghost_pay']['name']);
        $this->assertSame(1, $by_id['ghost_pay']['orders']);
        $this->assertSame(2500, $this->minor($by_id['ghost_pay']['total_sales_money_object']));
        $this->assertSame('unknown_pay', $by_id['unknown_pay']['name']);
        $this->assertSame('ghost_pay', $items[0]['id']);
    }

    /**
     * Scenario "Payment method change": a method row has the change of its Total sales.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payment_method_has_the_change_of_its_total_sales(): void
    {
        $this->make_sale('2026-09-30 10:00:00', 10000, ['payment_provider' => 'ghost_pay']);
        $this->make_sale('2026-10-01 10:00:00', 13600, ['payment_provider' => 'ghost_pay']);

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['sales_by_payment_method']['items'];

        $this->assertSame(13600, $this->minor($items[0]['total_sales_money_object']));
        $this->assertSame(10000, $this->minor($items[0]['previous_total_sales_money_object']));
        $this->assertSame(36.0, (float) $items[0]['change']);
    }

    /**
     * Scenario "Payment method new in the range": a method with no previous sales has previous 0 and no change.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payment_method_new_in_the_range_has_no_change(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 2000, ['payment_provider' => 'ghost_pay']);

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['sales_by_payment_method']['items'];

        $this->assertSame(0, $this->minor($items[0]['previous_total_sales_money_object']));
        $this->assertNull($items[0]['change']);

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'none'])['cards']['sales_by_payment_method']['items'];

        $this->assertNull($items[0]['previous_total_sales_money_object']);
        $this->assertNull($items[0]['change']);
    }

    /**
     * Payment method and shipping method metrics: the shipping method name falls back to the saved metadata.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shipping_method_uses_the_saved_name_and_charges_without_tax(): void
    {
        $this->make_order([
            'shipping_method' => 'gone-method',
            'shipping_metadata' => ['shipping_method' => ['name' => 'Bike courier']],
            'base_shipping_total' => 880,
            'base_shipping_tax_amount' => 80,
            'base_subtotal' => 1000,
            'base_total' => 1880,
        ], [['base_subtotal' => 1000, 'base_total' => 1000]], '2026-10-01 10:00:00', '2026-10-01 10:00:00');

        $items = $this->overview_between('2026-10-01', '2026-10-14')['cards']['shipping_charges_by_method']['items'];

        $this->assertCount(1, $items);
        $this->assertSame('Bike courier', $items[0]['name']);
        $this->assertSame(1, $items[0]['orders']);
        $this->assertSame(800, $this->minor($items[0]['shipping_charges_money_object']));
    }

    /**
     * Scenario "Tax by shipping region": billed to Canada, shipped to Texas, US, the tax counts under Texas.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_counts_under_the_shipping_region(): void
    {
        $order = $this->make_sale('2026-10-01 10:00:00', 1000, [
            'billing_country' => 'CA',
            'billing_state' => 'ON',
            'shipping_country' => 'US',
            'shipping_state' => 'TX',
            'base_tax_total' => 120,
        ]);
        OrderTax::create(['order_id' => $order->id, 'type' => OrderTaxType::PRODUCT, 'name' => 'Sales tax', 'rate' => 10, 'invoiced_amount' => 100, 'base_amount' => 100]);
        OrderTax::create(['order_id' => $order->id, 'type' => OrderTaxType::SHIPPING, 'name' => 'Sales tax', 'rate' => 10, 'invoiced_amount' => 20, 'base_amount' => 20]);

        $items = $this->overview_between('2026-10-01', '2026-10-14')['cards']['taxes_by_region']['items'];

        $this->assertCount(1, $items);
        $this->assertSame('US', $items[0]['country']);
        $this->assertSame('TX', $items[0]['state']);
        $this->assertSame('Texas, United States', $items[0]['name']);
        $this->assertSame(100, $this->minor($items[0]['product_tax_money_object']));
        $this->assertSame(20, $this->minor($items[0]['shipping_tax_money_object']));
        $this->assertSame(120, $this->minor($items[0]['total_tax_money_object']));
    }

    /**
     * Scenario "Tax region change": Total tax 600 in the previous period and 750 in the range give a change of 25.0.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_region_has_the_change_of_its_total_tax(): void
    {
        foreach (['2026-09-30 10:00:00' => 600, '2026-10-01 10:00:00' => 750] as $paid_at => $tax) {
            $order = $this->make_sale($paid_at, 1000, ['shipping_country' => 'US', 'shipping_state' => 'TX', 'base_tax_total' => $tax]);
            OrderTax::create(['order_id' => $order->id, 'type' => OrderTaxType::PRODUCT, 'name' => 'Sales tax', 'rate' => 10, 'invoiced_amount' => $tax, 'base_amount' => $tax]);
        }

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['taxes_by_region']['items'];

        $this->assertSame(750, $this->minor($items[0]['total_tax_money_object']));
        $this->assertSame(600, $this->minor($items[0]['previous_total_tax_money_object']));
        $this->assertSame(25.0, (float) $items[0]['change']);
    }

    /**
     * Scenario "Tax region new in the range": a region with no previous tax has previous 0 and no change.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_region_new_in_the_range_has_no_change(): void
    {
        $order = $this->make_sale('2026-10-01 10:00:00', 1000, ['shipping_country' => 'CA', 'shipping_state' => 'ON', 'base_tax_total' => 300]);
        OrderTax::create(['order_id' => $order->id, 'type' => OrderTaxType::PRODUCT, 'name' => 'HST', 'rate' => 13, 'invoiced_amount' => 300, 'base_amount' => 300]);

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['taxes_by_region']['items'];

        $this->assertSame(0, $this->minor($items[0]['previous_total_tax_money_object']));
        $this->assertNull($items[0]['change']);

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'none'])['cards']['taxes_by_region']['items'];

        $this->assertNull($items[0]['previous_total_tax_money_object']);
        $this->assertNull($items[0]['change']);
    }

    /**
     * Scenario "Shipping method change": Shipping charges 1000 in the previous period and 1200 in the range give a change of 20.0.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shipping_method_has_the_change_of_its_shipping_charges(): void
    {
        $this->make_sale('2026-09-30 10:00:00', 1000, ['shipping_method' => 'standard', 'base_shipping_total' => 1000]);
        $this->make_sale('2026-10-01 10:00:00', 1000, ['shipping_method' => 'standard', 'base_shipping_total' => 1200]);

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['shipping_charges_by_method']['items'];

        $this->assertSame(1200, $this->minor($items[0]['shipping_charges_money_object']));
        $this->assertSame(1000, $this->minor($items[0]['previous_shipping_charges_money_object']));
        $this->assertSame(20.0, (float) $items[0]['change']);
    }

    /**
     * Scenario "Shipping method new in the range": a method with no previous orders has previous 0 and no change.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shipping_method_new_in_the_range_has_no_change(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000, ['shipping_method' => 'express', 'base_shipping_total' => 500]);

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'previous_period'])['cards']['shipping_charges_by_method']['items'];

        $this->assertSame(0, $this->minor($items[0]['previous_shipping_charges_money_object']));
        $this->assertNull($items[0]['change']);

        $items = $this->overview_between('2026-10-01', '2026-10-01', ['compare' => 'none'])['cards']['shipping_charges_by_method']['items'];

        $this->assertNull($items[0]['previous_shipping_charges_money_object']);
        $this->assertNull($items[0]['change']);
    }

    /**
     * Scenario "Returning only": Lena's first paid order is Sep 3 and her second Sep 20; range Sep 15 - Oct 14.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_with_an_earlier_first_order_is_returning_only(): void
    {
        $this->seed_lena();

        $data = $this->overview_between('2026-09-15', '2026-10-14');
        $card = $data['cards']['new_vs_returning_customers'];

        $this->assertSame(1, $card['total']['current']);
        $this->assertSame(0, $card['new_total']);
        $this->assertSame(1, $card['returning_total']);
        $this->assertEqualsWithDelta(100.0, $data['kpis']['returning_customer_rate']['current'], 0.05);
    }

    /**
     * Scenario "New and returning": in September Lena counts as new and as returning, and Customers counts her once.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customer_with_first_and_second_order_in_range_is_both(): void
    {
        $this->seed_lena();

        $card = $this->overview_between('2026-09-01', '2026-09-30')['cards']['new_vs_returning_customers'];
        $points = array_column($card['series'], null, 'date');

        $this->assertSame(1, $card['total']['current']);
        $this->assertSame(1, $card['new_total']);
        $this->assertSame(1, $card['returning_total']);
        $this->assertSame(1, $points['2026-09-03']['new']);
        $this->assertSame(0, $points['2026-09-03']['returning']);
        $this->assertSame(0, $points['2026-09-20']['new']);
        $this->assertSame(1, $points['2026-09-20']['returning']);
    }

    /**
     * Scenario "Guest and registered with the same email": both orders belong to one customer in Customers.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_guest_and_registered_orders_are_one_customer(): void
    {
        $customer = Customer::create(['first_name' => 'Lena', 'last_name' => 'Test', 'email' => 'lena@example.com']);
        $this->make_sale('2026-09-03 10:00:00', 1000, ['customer_id' => $customer->id, 'customer_email' => 'lena@example.com']);
        $this->make_sale('2026-09-20 10:00:00', 1000, ['customer_email' => 'LENA@example.com']);

        $card = $this->overview_between('2026-09-01', '2026-09-30')['cards']['new_vs_returning_customers'];

        $this->assertSame(1, $card['total']['current']);
    }

    /**
     * Scenario "Deleted customer": the orders are still one customer and keep their new or returning status.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_deleted_customer_keeps_new_and_returning_status(): void
    {
        $customer = $this->seed_lena();
        $before = $this->overview_between('2026-09-15', '2026-10-14')['cards']['new_vs_returning_customers'];

        Customer::query()->where('id', $customer->id)->delete();
        $after = $this->overview_between('2026-09-15', '2026-10-14')['cards']['new_vs_returning_customers'];

        $this->assertSame($before['total']['current'], $after['total']['current']);
        $this->assertSame(0, $after['new_total']);
        $this->assertSame(1, $after['returning_total']);
    }

    /**
     * Scenario "Variant without its own threshold": store default 5, tracked variant with 4 available is low stock.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_variant_without_a_threshold_uses_the_store_default(): void
    {
        Settings::get('product')->set(['low_stock_threshold' => 5], false);
        $before = $this->overview()['cards']['inventory_health'];
        $product_id = $this->create_product()['id'];

        $variant = $this->make_variant($product_id, ['available_quantity' => 4, 'low_stock_threshold' => null]);
        $after = $this->overview()['cards']['inventory_health'];

        $this->assertSame($before['low_stock'] + 1, $after['low_stock']);
        $listed = array_column($after['lowest'], null, 'variant_id');
        $this->assertSame('low_stock', $listed[$variant->id]['status']);
        $this->assertSame(4, $listed[$variant->id]['available_quantity']);
    }

    /**
     * Scenario "Backorder variant": a tracked variant that allows backorders with -2 available is out of stock.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_backorder_variant_with_negative_stock_is_out_of_stock(): void
    {
        $before = $this->overview()['cards']['inventory_health'];
        $product_id = $this->create_product()['id'];

        $variant = $this->make_variant($product_id, ['available_quantity' => -2, 'allow_back_order' => true]);
        $after = $this->overview()['cards']['inventory_health'];

        $this->assertSame($before['out_of_stock'] + 1, $after['out_of_stock']);
        $listed = array_column($after['lowest'], null, 'variant_id');
        $this->assertSame('out_of_stock', $listed[$variant->id]['status']);
        $this->assertLessThanOrEqual(4, count($after['lowest']));
    }

    /**
     * Scenario "In-stock variant with low quantity": the Inventory health list holds only out-of-stock and low-stock variants.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_in_stock_variant_with_low_quantity_is_not_listed(): void
    {
        $product_id = $this->create_product()['id'];

        $variant = $this->make_variant($product_id, ['available_quantity' => 1, 'low_stock_threshold' => 0]);
        $after = $this->overview()['cards']['inventory_health'];

        $this->assertNotContains($variant->id, array_column($after['lowest'], 'variant_id'));

        foreach ($after['lowest'] as $item) {
            $this->assertContains($item['status'], ['out_of_stock', 'low_stock']);
        }
    }

    /**
     * Inventory metrics: an untracked variant is in stock when in_stock is set, else out of stock; the date range does not matter.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_untracked_variants_use_the_in_stock_flag_and_ignore_the_range(): void
    {
        $before = $this->overview()['cards']['inventory_health'];
        $product_id = $this->create_product()['id'];
        $this->make_variant($product_id, ['track_inventory' => false, 'in_stock' => true, 'available_quantity' => 0]);
        $this->make_variant($product_id, ['track_inventory' => false, 'in_stock' => false, 'available_quantity' => 50]);

        $today = $this->overview(['range' => 'today'])['cards']['inventory_health'];
        $year = $this->overview(['range' => 'year_to_date'])['cards']['inventory_health'];

        // +2 in stock: the product's default variant and the untracked in-stock variant.
        $this->assertSame($before['in_stock'] + 2, $today['in_stock']);
        $this->assertSame($before['out_of_stock'] + 1, $today['out_of_stock']);
        $this->assertSame($today['in_stock'], $year['in_stock']);
        $this->assertSame($today['out_of_stock'], $year['out_of_stock']);
    }

    /**
     * Scenario "Order marked paid": after an admin marks an order paid, it is in the sales metrics for today.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_marked_paid_is_in_todays_sales(): void
    {
        Queue::fake();
        $today = wp_date('Y-m-d');
        $this->freeze_today($today);
        $order = $this->make_order([
            'payment_status' => PaymentStatus::PENDING,
            'base_subtotal' => 2500,
            'base_total' => 2500,
            'invoiced_subtotal' => 2500,
            'invoiced_total' => 2500,
            'items_count' => 1,
        ], [['base_subtotal' => 2500, 'base_total' => 2500, 'invoiced_subtotal' => 2500, 'invoiced_total' => 2500]], null, gmdate('Y-m-d H:i:s', time() - 3600));
        $before = $this->overview(['range' => 'today']);
        $this->assertSame(0, $this->minor($before['kpis']['gross_sales']['current_money_object']));

        $this->assert_api_success($this->request('PATCH', 'orders/' . $order->id . '/action', ['action' => 'mark-as-paid', 'payment_provider' => 'paypal']));
        $after = $this->overview(['range' => 'today']);

        $this->assertSame(2500, $this->minor($after['kpis']['gross_sales']['current_money_object']));
    }

    /**
     * Scenario "Order edited after payment": the next response uses the new amounts on the original sales date.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_edit_after_payment_shows_new_amounts_on_the_original_date(): void
    {
        $order = $this->make_sale('2026-09-03 10:00:00', 1000);
        $this->assertSame(1000, $this->minor($this->overview_between('2026-09-03', '2026-09-03')['kpis']['gross_sales']['current_money_object']));

        $now = gmdate('Y-m-d H:i:s');
        OrderItem::query()->where('order_id', $order->id)->update(['base_subtotal' => 1500, 'base_total' => 1500]);
        Order::query()->where('id', $order->id)->update(['base_subtotal' => 1500, 'base_total' => 1500, 'updated_at' => $now]);

        $data = $this->overview_between('2026-09-03', '2026-09-03');

        $this->assertSame(1500, $this->minor($data['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(1500, $this->breakdown_minor($data, 'total_sales'));
    }

    /**
     * Scenario "Time zone changed": the next response puts every order on its Asia/Dhaka day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_time_zone_change_moves_orders_to_the_new_local_day(): void
    {
        $this->make_sale('2026-10-01 20:30:00', 1000);
        $this->assertSame(1000, $this->minor($this->overview_between('2026-10-01', '2026-10-01')['kpis']['gross_sales']['current_money_object']));

        $this->set_timezone('Asia/Dhaka');
        $oct_1 = $this->overview_between('2026-10-01', '2026-10-01');
        $oct_2 = $this->overview_between('2026-10-02', '2026-10-02');

        $this->assertArrayNotHasKey('preparing', $oct_1);
        $this->assertSame(0, $this->minor($oct_1['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(1000, $this->minor($oct_2['kpis']['gross_sales']['current_money_object']));
    }

    /**
     * Scenario "First visit": a store with 300 orders gets metrics in the first response, with no preparing key.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_first_visit_gets_metrics_in_the_first_response(): void
    {
        for ($index = 0; $index < 300; $index++) {
            $this->make_sale('2026-10-01 10:00:00', 100);
        }

        $data = $this->overview_between('2026-10-01', '2026-10-01');

        $this->assertArrayNotHasKey('preparing', $data);
        $this->assertArrayNotHasKey('progress', $data);
        $this->assertSame(30000, $this->minor($data['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(300, $data['kpis']['orders']['current']);
    }

    /**
     * Scenario "Half-hour offset": in Asia/Kolkata (UTC+5:30) an order paid at 18:45 UTC is a sale on Oct 2.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_half_hour_offset_order_is_a_sale_on_the_next_day(): void
    {
        $this->set_timezone('Asia/Kolkata');
        $this->make_sale('2026-10-01 18:45:00', 1000);
        $this->make_sale('2026-10-01 18:15:00', 400);

        $oct_1 = $this->overview_between('2026-10-01', '2026-10-01');
        $oct_2 = $this->overview_between('2026-10-02', '2026-10-02');

        $this->assertSame(400, $this->minor($oct_1['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(1000, $this->minor($oct_2['kpis']['gross_sales']['current_money_object']));
    }

    /**
     * Store days: the order date of a placed order is also on the site time zone day.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_placed_order_date_uses_the_site_time_zone(): void
    {
        $this->set_timezone('Asia/Dhaka');
        $this->make_sale('2026-10-01 20:30:00', 1000);

        $oct_1 = $this->overview_between('2026-10-01', '2026-10-01');
        $oct_2 = $this->overview_between('2026-10-02', '2026-10-02');

        $this->assertSame(0, $oct_1['kpis']['orders']['current']);
        $this->assertSame(1, $oct_2['kpis']['orders']['current']);
    }

    /**
     * Sales orders: an empty paid_at falls back to created_at for the sales date.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sales_date_falls_back_to_created_at_when_paid_at_is_empty(): void
    {
        $this->make_order([
            'base_subtotal' => 1000,
            'invoiced_subtotal' => 1000,
            'base_total' => 1000,
            'invoiced_total' => 1000,
            'items_count' => 1,
        ], [['base_subtotal' => 1000, 'base_total' => 1000, 'invoiced_subtotal' => 1000, 'invoiced_total' => 1000]], null, '2026-10-03 10:00:00');

        $oct_3 = $this->overview_between('2026-10-03', '2026-10-03');
        $oct_4 = $this->overview_between('2026-10-04', '2026-10-04');

        $this->assertSame(1000, $this->minor($oct_3['kpis']['gross_sales']['current_money_object']));
        $this->assertSame(0, $this->minor($oct_4['kpis']['gross_sales']['current_money_object']));
    }

    /**
     * Data for payment statuses: status, whether it is a sales order, whether it is a placed order.
     *
     * @return array
     * @since 1.0.0
     */
    public function payment_statuses(): array
    {
        return [
            'paid' => [PaymentStatus::PAID, true, true],
            'refunding' => [PaymentStatus::REFUNDING, true, true],
            'refunded' => [PaymentStatus::REFUNDED, true, true],
            'unpaid' => [PaymentStatus::UNPAID, false, true],
            'pending' => [PaymentStatus::PENDING, false, true],
            'processing' => [PaymentStatus::PROCESSING, false, true],
            'cancelled' => [PaymentStatus::CANCELLED, false, true],
            'failed' => [PaymentStatus::FAILED, false, false],
        ];
    }

    /**
     * Scenarios "Sales orders" and "Placed orders": only paid, refunding and refunded orders are sales; every status but failed is placed.
     *
     * @dataProvider payment_statuses
     *
     * @param string $payment_status Payment status.
     * @param bool   $is_sale        Expected to count in sales metrics.
     * @param bool   $is_placed      Expected to count in Orders.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payment_status_decides_sales_and_placed_orders(string $payment_status, bool $is_sale, bool $is_placed): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000, ['payment_status' => $payment_status]);

        $data = $this->overview_between('2026-10-01', '2026-10-01');

        $this->assertSame($is_sale ? 1000 : 0, $this->minor($data['kpis']['gross_sales']['current_money_object']));
        $this->assertSame($is_sale ? 1 : 0, $data['cards']['new_vs_returning_customers']['total']['current']);
        $this->assertSame($is_placed ? 1 : 0, $data['kpis']['orders']['current']);
    }

    /**
     * Scenario "Partial refund": the base amount is rounded half up (1 x 3 / 2 = 1.5 gives 2).
     *
     * @return void
     * @since 1.0.0
     */
    public function test_refund_base_amount_is_rounded_half_up(): void
    {
        $order = $this->make_sale('2026-09-03 10:00:00', 3, ['base_total' => 3, 'invoiced_total' => 2]);
        $this->make_refund($order, 1, RefundStatus::COMPLETED, '2026-09-20 10:00:00');

        $data = $this->overview_between('2026-09-20', '2026-09-20');

        $this->assertSame(2, $this->breakdown_minor($data, 'returns'));
    }

    /**
     * Returns: a refund on an order with invoiced_total 0 has a base amount of 0.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_refund_on_a_zero_invoiced_total_order_returns_nothing(): void
    {
        $order = $this->make_sale('2026-09-03 10:00:00', 0, ['base_total' => 0, 'invoiced_total' => 0]);
        $this->make_refund($order, 500, RefundStatus::COMPLETED, '2026-09-20 10:00:00');

        $data = $this->overview_between('2026-09-20', '2026-09-20');

        $this->assertSame(0, $this->breakdown_minor($data, 'returns'));
    }

    /**
     * Returns: a completed refund on an order that is not a sales order is not in Returns.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_refund_on_a_non_sales_order_is_not_a_return(): void
    {
        $order = $this->make_sale('2026-09-03 10:00:00', 1000, ['payment_status' => PaymentStatus::UNPAID]);
        $this->make_refund($order, 500, RefundStatus::COMPLETED, '2026-09-20 10:00:00');

        $data = $this->overview_between('2026-09-20', '2026-09-20');

        $this->assertSame(0, $this->breakdown_minor($data, 'returns'));
    }

    /**
     * Returns: a refund that is no longer completed leaves Returns on the next request.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_refund_that_is_no_longer_completed_leaves_returns(): void
    {
        $order = $this->make_sale('2026-09-03 10:00:00', 10000, ['invoiced_total' => 10000]);
        $refund = $this->make_refund($order, 500, RefundStatus::COMPLETED, '2026-09-20 10:00:00');
        $this->assertSame(500, $this->breakdown_minor($this->overview_between('2026-09-20', '2026-09-20'), 'returns'));

        Refund::query()->where('id', $refund->id)->update(['status' => RefundStatus::CANCELLED, 'updated_at' => '2026-09-21 10:00:00']);

        $this->assertSame(0, $this->breakdown_minor($this->overview_between('2026-09-01', '2026-09-30'), 'returns'));
    }

    /**
     * Scenario "Refund edited after completion": a completed refund edited on Sep 25 moves its Returns to Sep 25.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_refund_edited_after_completion_moves_returns_to_the_edit_day(): void
    {
        $order = $this->make_sale('2026-09-03 10:00:00', 10000, ['invoiced_total' => 10000]);
        $refund = $this->make_refund($order, 1000, RefundStatus::COMPLETED, '2026-09-20 10:00:00');
        $this->assertSame(1000, $this->breakdown_minor($this->overview_between('2026-09-20', '2026-09-20'), 'returns'));

        Refund::query()->where('id', $refund->id)->update(['updated_at' => '2026-09-25 12:00:00']);

        $this->assertSame(0, $this->breakdown_minor($this->overview_between('2026-09-20', '2026-09-20'), 'returns'));
        $this->assertSame(1000, $this->breakdown_minor($this->overview_between('2026-09-25', '2026-09-25'), 'returns'));
    }

    /**
     * Scenario "Product deleted after the sale": a product sold, then deleted through the products endpoint, shows under its saved name with an empty product id.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_deleted_after_the_sale_shows_the_saved_name(): void
    {
        $product_id = $this->create_product(['title' => 'Linen shirt'])['id'];
        $this->make_sale_with_item('2026-10-01 10:00:00', ['product_id' => $product_id, 'product_name' => 'Linen shirt (saved)', 'quantity' => 2, 'base_subtotal' => 3000, 'base_total' => 3000]);
        $before = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_product']['items'];
        $this->assertSame($product_id, $before[0]['product_id']);
        $this->assertFalse($before[0]['is_deleted']);

        $this->assert_api_success($this->request('DELETE', 'products/' . $product_id));
        $items = $this->overview_between('2026-10-01', '2026-10-14')['cards']['sales_by_product']['items'];

        $this->assertCount(1, $items);
        $this->assertSame('Linen shirt (saved)', $items[0]['name']);
        $this->assertTrue($items[0]['is_deleted']);
        $this->assertNull($items[0]['product_id']);
        $this->assertSame(2, $items[0]['units_sold']);
        $this->assertSame(3000, $this->minor($items[0]['net_sales_money_object']));
    }

    /**
     * Scenario "Guest registers later": a guest paid on Sep 3, a customer with that email is created, and orders again; Customers is 1 and the second order is returning.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_guest_who_registers_later_is_one_customer(): void
    {
        $this->make_sale('2026-09-03 10:00:00', 1000, ['customer_email' => 'later@example.com']);
        $this->assertSame(1, $this->overview_between('2026-09-01', '2026-09-30')['cards']['new_vs_returning_customers']['total']['current']);

        $customer = Customer::create(['first_name' => 'Late', 'last_name' => 'Joiner', 'email' => 'later@example.com']);
        $this->make_sale('2026-09-20 10:00:00', 1500, ['customer_id' => $customer->id, 'customer_email' => 'later@example.com']);

        $september = $this->overview_between('2026-09-01', '2026-09-30')['cards']['new_vs_returning_customers'];
        $later = $this->overview_between('2026-09-15', '2026-10-14')['cards']['new_vs_returning_customers'];

        $this->assertSame(1, $september['total']['current']);
        $this->assertSame(1, $september['new_total']);
        $this->assertSame(1, $september['returning_total']);
        $this->assertSame(1, $later['total']['current']);
        $this->assertSame(0, $later['new_total']);
        $this->assertSame(1, $later['returning_total']);
    }

    /**
     * Customer identity: a guest is keyed by the trimmed, lower-cased email.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_guest_emails_are_trimmed_and_lower_cased(): void
    {
        $this->make_sale('2026-09-03 10:00:00', 1000, ['customer_email' => '  Guest@Example.COM ']);
        $this->make_sale('2026-09-20 10:00:00', 1000, ['customer_email' => 'guest@example.com']);

        $card = $this->overview_between('2026-09-15', '2026-10-14')['cards']['new_vs_returning_customers'];

        $this->assertSame(1, $card['total']['current']);
        $this->assertSame(0, $card['new_total']);
        $this->assertSame(1, $card['returning_total']);
    }

    /**
     * Customer identity (design D3): orders without any email are one customer each.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_orders_without_an_email_are_one_customer_each(): void
    {
        $this->make_sale('2026-09-03 10:00:00', 1000, ['customer_email' => '']);
        $this->make_sale('2026-09-04 10:00:00', 1000, ['customer_email' => '']);

        $card = $this->overview_between('2026-09-01', '2026-09-30')['cards']['new_vs_returning_customers'];

        $this->assertSame(2, $card['total']['current']);
        $this->assertSame(2, $card['new_total']);
        $this->assertSame(0, $card['returning_total']);
    }

    /**
     * Customer identity: guest orders merged into a new customer stay one customer with their first-paid status.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_merged_guest_orders_stay_one_customer(): void
    {
        $email = 'merge-' . strtolower(wp_generate_password(8, false)) . '@example.com';
        $this->make_sale('2026-09-03 10:00:00', 1000, ['customer_email' => $email]);
        $user_id = (int) static::factory()->user->create(['user_email' => $email, 'first_name' => 'Merge', 'last_name' => 'Case']);
        app()->make(OrderService::class)->merge_guest_orders($user_id);
        $customer = Customer::where('user_id', $user_id)->first();
        $this->make_sale('2026-09-20 10:00:00', 1000, ['customer_id' => $customer->id, 'customer_email' => $email]);

        $card = $this->overview_between('2026-09-15', '2026-10-14')['cards']['new_vs_returning_customers'];

        $this->assertSame(1, $card['total']['current']);
        $this->assertSame(0, $card['new_total']);
        $this->assertSame(1, $card['returning_total']);
    }

    /**
     * Customer identity: the first paid order is a sales order. An earlier unpaid order does not make a later paid order returning.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_an_earlier_unpaid_order_does_not_make_the_first_paid_order_returning(): void
    {
        $email = 'first@example.com';
        $this->make_order(['payment_status' => PaymentStatus::UNPAID, 'customer_email' => $email], [], null, '2026-08-01 10:00:00');
        $this->make_sale('2026-09-05 10:00:00', 1000, ['customer_email' => $email]);
        $this->make_sale('2026-09-10 10:00:00', 1000, ['customer_email' => $email]);

        $first = $this->overview_between('2026-09-05', '2026-09-05')['cards']['new_vs_returning_customers'];
        $second = $this->overview_between('2026-09-10', '2026-09-10')['cards']['new_vs_returning_customers'];

        $this->assertSame(1, $first['new_total']);
        $this->assertSame(0, $first['returning_total']);
        $this->assertSame(0, $second['new_total']);
        $this->assertSame(1, $second['returning_total']);
    }

    /**
     * Create a paid order with one custom item.
     *
     * @param string $paid_at Payment time, UTC.
     * @param array  $item    Item attributes; base_subtotal and base_total set the amounts.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function make_sale_with_item(string $paid_at, array $item): Order
    {
        $subtotal = $item['base_subtotal'] ?? 0;
        $total = $item['base_total'] ?? $subtotal;
        $tax = $item['base_tax_total'] ?? 0;
        $quantity = $item['quantity'] ?? 1;

        return $this->make_order([
            'base_subtotal' => $subtotal,
            'invoiced_subtotal' => $subtotal,
            'base_total' => $total,
            'invoiced_total' => $total,
            'base_tax_total' => $tax,
            'invoiced_tax_total' => $tax,
            'items_count' => $quantity,
        ], [array_merge([
            'invoiced_subtotal' => $subtotal,
            'invoiced_total' => $total,
            'invoiced_tax_total' => $tax,
        ], $item)], $paid_at, $paid_at);
    }

    /**
     * Create the free-shipping order used by the "Free shipping" scenarios: an 800 shipping fee was removed by FREESHIP50.
     *
     * @param string $paid_at Payment time, UTC.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function make_free_shipping_order(string $paid_at): Order
    {
        $order = $this->make_order([
            'base_subtotal' => 5000,
            'invoiced_subtotal' => 5000,
            'base_shipping_total' => 0,
            'base_discount_total' => 800,
            'base_total' => 5000,
            'invoiced_total' => 5000,
            'items_count' => 1,
        ], [['base_subtotal' => 5000, 'base_total' => 5000, 'invoiced_subtotal' => 5000, 'invoiced_total' => 5000]], $paid_at, $paid_at);
        OrderCoupon::create([
            'order_id' => $order->id,
            'code' => 'FREESHIP50',
            'title' => 'Free shipping',
            'discount_type' => 'free-shipping',
            'invoiced_discount_amount' => 800,
            'base_discount_amount' => 800,
        ]);

        return $order;
    }

    /**
     * Create Lena, a registered customer whose paid orders are on Sep 3 and Sep 20.
     *
     * @return Customer
     * @since 1.0.0
     */
    protected function seed_lena(): Customer
    {
        $customer = Customer::create(['first_name' => 'Lena', 'last_name' => 'Test', 'email' => 'lena@example.com']);
        $this->make_sale('2026-09-03 10:00:00', 1000, ['customer_id' => $customer->id, 'customer_email' => 'lena@example.com']);
        $this->make_sale('2026-09-20 10:00:00', 1500, ['customer_id' => $customer->id, 'customer_email' => 'lena@example.com']);

        return $customer;
    }

    /**
     * Create a variant for a product.
     *
     * @param int   $product_id Product id.
     * @param array $overrides  Variant attribute overrides.
     *
     * @return Variant
     * @since 1.0.0
     */
    protected function make_variant(int $product_id, array $overrides = []): Variant
    {
        return Variant::create(array_merge([
            'product_id' => $product_id,
            'base_price' => 1000,
            'sku' => 'SKU-' . wp_generate_password(8, false),
            'track_inventory' => true,
            'allow_back_order' => false,
            'available_quantity' => 10,
            'in_stock' => true,
            'is_default' => false,
        ], $overrides));
    }
}
