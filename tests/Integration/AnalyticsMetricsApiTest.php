<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

/**
 * Covers task 5.1: access, validation and the response shape of GET /analytics/metrics/{key}.
 *
 * Spec: analytics-metrics (Analytics endpoint access, Data freshness).
 */
class AnalyticsMetricsApiTest extends RestTestCase
{
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
    }

    /**
     * Data for users without the capability: the role.
     *
     * @return array
     * @since 1.0.0
     */
    public function roles_without_manage_options(): array
    {
        return [
            'editor' => ['editor'],
            'subscriber' => ['subscriber'],
        ];
    }

    /**
     * Scenario "Shop manager without the capability": the response is 403 and contains no data.
     *
     * @dataProvider roles_without_manage_options
     *
     * @param string $role User role.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_user_without_manage_options_gets_403_and_no_data(string $role): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000);
        wp_set_current_user(static::factory()->user->create(['role' => $role]));

        $payload = $this->assert_api_error($this->request('GET', 'analytics/metrics/kpis', ['range' => 'last_30']), 403);

        // WordPress permission errors always carry data.status; no metrics may leak.
        $this->assertSame(['status' => 403], $payload['data'] ?? ['status' => 403]);
        $this->assertArrayNotHasKey('kpis', $payload);
        $this->assertArrayNotHasKey('cards', $payload);
    }

    /**
     * Scenario "Shop manager without the capability" for the regions endpoint: the response is 403 and contains no data.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_regions_without_manage_options_gets_403(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000, ['shipping_country' => 'US']);
        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));

        $payload = $this->assert_api_error($this->request('GET', 'analytics/regions', ['country' => 'US']), 403);

        $this->assertArrayNotHasKey('sales', $payload);
    }

    /**
     * Scenario "Unknown country": the regions endpoint is 422 with an error on country.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_regions_of_an_unknown_country_is_422(): void
    {
        $payload = $this->assert_validation_error($this->request('GET', 'analytics/regions', ['country' => 'ZZ']));

        $this->assertArrayHasKey('country', $payload['errors']);
    }

    /**
     * Regions endpoint: a known country with no orders has three empty lists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_regions_of_a_country_without_orders_are_empty(): void
    {
        $data = $this->assert_api_success($this->request('GET', 'analytics/regions', ['country' => 'FR']))['data'];

        $this->assertSame(['country' => 'FR', 'sales' => [], 'orders' => [], 'customers' => []], $data);
    }

    /**
     * A visitor who is not logged in gets 401, like the other store management endpoints.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_visitor_gets_401(): void
    {
        $this->logout();

        $this->assert_api_error($this->request('GET', 'analytics/metrics/kpis'), 401);
    }

    /**
     * Scenario "Custom range in the future": a custom range that ends after today is 422 with a field error.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_custom_range_ending_after_today_is_422(): void
    {
        $payload = $this->assert_validation_error($this->request('GET', 'analytics/metrics/kpis', [
            'range' => 'custom',
            'from' => '2026-10-01',
            'to' => '2026-10-15',
        ]));

        $this->assertArrayHasKey('to', $payload['errors']);
    }

    /**
     * Endpoint access: an unknown preset is 422 with a field error.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_preset_is_422(): void
    {
        $payload = $this->assert_validation_error($this->request('GET', 'analytics/metrics/kpis', ['range' => 'last_1000_years']));

        $this->assertArrayHasKey('range', $payload['errors']);
    }

    /**
     * Endpoint access: an unknown comparison is 422 with a field error.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_comparison_is_422(): void
    {
        $payload = $this->assert_validation_error($this->request('GET', 'analytics/metrics/kpis', ['range' => 'last_30', 'compare' => 'sideways']));

        $this->assertArrayHasKey('compare', $payload['errors']);
    }

    /**
     * Endpoint access: a custom range needs both dates, and the start cannot be after the end.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_custom_range_needs_ordered_dates(): void
    {
        $missing = $this->assert_validation_error($this->request('GET', 'analytics/metrics/kpis', ['range' => 'custom', 'from' => '2026-10-01']));
        $reversed = $this->assert_validation_error($this->request('GET', 'analytics/metrics/kpis', ['range' => 'custom', 'from' => '2026-10-10', 'to' => '2026-10-01']));

        $this->assertArrayHasKey('to', $missing['errors']);
        $this->assertArrayHasKey('from', $reversed['errors']);
    }

    /**
     * Data for invalid custom dates: the query parameters and the field with the error.
     *
     * @return array
     * @since 1.0.0
     */
    public function invalid_custom_dates(): array
    {
        return [
            'day that does not exist' => [['range' => 'custom', 'from' => '2026-02-30', 'to' => '2026-03-02'], 'from'],
            'wrong format' => [['range' => 'custom', 'from' => '2026-10-01', 'to' => '10/02/2026'], 'to'],
            'not a date' => [['range' => 'custom', 'from' => 'yesterday', 'to' => '2026-10-02'], 'from'],
            'comparison day that does not exist' => [['range' => 'last_30', 'compare' => 'custom', 'compare_from' => '2026-04-31', 'compare_to' => '2026-05-02'], 'compare_from'],
            'comparison wrong format' => [['range' => 'last_30', 'compare' => 'custom', 'compare_from' => '2026-05-01', 'compare_to' => '2026-5-2'], 'compare_to'],
        ];
    }

    /**
     * Endpoint access: a custom date that is not a real `Y-m-d` date is 422 with an error on that field.
     *
     * @dataProvider invalid_custom_dates
     *
     * @param array  $params Query parameters.
     * @param string $field  Field that has the error.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_invalid_custom_date_is_422(array $params, string $field): void
    {
        $payload = $this->assert_validation_error($this->request('GET', 'analytics/metrics/kpis', $params));

        $this->assertArrayHasKey($field, $payload['errors']);
    }

    /**
     * Scenario "First visit": a store with orders gets the metrics in the first response, with no preparing state.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_first_visit_with_orders_returns_metrics_in_the_first_response(): void
    {
        for ($index = 0; $index < 25; $index++) {
            $this->make_sale('2026-10-01 10:00:00', 1000);
        }

        $data = $this->overview();

        $this->assertArrayNotHasKey('preparing', $data);
        $this->assertArrayNotHasKey('progress', $data);
        $this->assertTrue($data['has_orders']);
        $this->assertSame(25, $data['kpis']['orders']['current']);
        $this->assertSame(25000, $this->minor($data['kpis']['gross_sales']['current_money_object']));
    }

    /**
     * Scenario "First visit": an empty store also has no preparing state.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_empty_store_response_has_no_preparing_state(): void
    {
        $data = $this->overview();

        $this->assertArrayNotHasKey('preparing', $data);
        $this->assertArrayNotHasKey('progress', $data);
        $this->assertFalse($data['has_orders']);
    }

    /**
     * Full shape for a seeded store: every key the Analytics page reads, with *_money_object keys for money.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_full_response_shape_for_a_seeded_store(): void
    {
        $order = $this->make_sale('2026-10-01 10:00:00', 10000, ['payment_provider' => 'paypal', 'shipping_method' => 'method-0001'], 2);
        $this->make_sale('2026-09-10 10:00:00', 5000);
        $this->make_refund($order, 1000, RefundStatus::COMPLETED, '2026-10-02 10:00:00');

        $data = $this->overview(['range' => 'last_30', 'compare' => 'previous_period']);

        foreach (['range', 'compare', 'granularity', 'base_currency_code', 'has_orders', 'kpis', 'cards'] as $key) {
            $this->assertArrayHasKey($key, $data);
        }
        $this->assertArrayNotHasKey('preparing', $data);
        $this->assertTrue($data['has_orders']);
        $this->assertArrayNotHasKey('currencies', $data);
        $this->assertSame(['preset', 'from', 'to', 'days'], array_keys($data['range']));
        $this->assertSame(['from', 'to'], array_keys($data['compare']));
        $this->assertSame('day', $data['granularity']);
        $this->assertArrayNotHasKey('granularity_size', $data);

        $this->assertSame(['gross_sales', 'orders', 'average_order_value', 'returning_customer_rate', 'net_sales', 'total_sales', 'items_ordered', 'discounts', 'new_customers', 'customers', 'shipping_charges'], array_keys($data['kpis']));
        foreach (['gross_sales', 'average_order_value', 'net_sales', 'total_sales', 'discounts', 'shipping_charges'] as $key) {
            $this->assert_money_metric($data['kpis'][$key]);
        }
        foreach (['orders', 'returning_customer_rate', 'items_ordered', 'new_customers', 'customers'] as $key) {
            $this->assert_count_metric($data['kpis'][$key]);
        }
        $this->assertCount(30, $data['kpis']['gross_sales']['series']);
        $this->assertSame(['date', 'label', 'span_label', 'value', 'previous_date', 'previous_label', 'previous_span_label', 'previous_value'], array_keys($data['kpis']['gross_sales']['series'][0]));

        $this->assertSame([
            'total_sales_over_time',
            'total_sales_breakdown',
            'sales_by_product',
            'sales_by_category',
            'average_order_value_over_time',
            'orders_over_time',
            'orders_by_fulfillment_status',
            'new_vs_returning_customers',
            'sales_by_coupon_code',
            'orders_by_time_of_day',
            'sales_by_location',
            'sales_by_payment_method',
            'taxes_by_region',
            'shipping_charges_by_method',
            'inventory_health',
        ], array_keys($data['cards']));

        $cards = $data['cards'];
        $this->assert_money_metric($cards['total_sales_over_time']['total']);
        $this->assertCount(30, $cards['total_sales_over_time']['series']);
        $this->assertSame(
            ['gross_sales', 'discounts', 'returns', 'net_sales', 'shipping', 'taxes', 'total_sales'],
            array_column($cards['total_sales_breakdown']['rows'], 'key')
        );
        $this->assert_money_metric($cards['total_sales_breakdown']['rows'][0]);
        $this->assertArrayHasKey('items', $cards['sales_by_product']);
        $this->assertArrayHasKey('items', $cards['sales_by_category']);
        $this->assert_money_metric($cards['average_order_value_over_time']['total']);
        $this->assert_count_metric($cards['orders_over_time']['total']);
        $this->assertArrayHasKey('items_ordered', $cards['orders_over_time']);
        $this->assertSame(
            ['unfulfilled', 'processing', 'on-hold', 'shipped', 'delivered', 'returned', 'cancelled'],
            array_column($cards['orders_by_fulfillment_status']['items'], 'status')
        );
        $this->assertArrayHasKey('total_orders', $cards['orders_by_fulfillment_status']);
        $this->assertArrayHasKey('delivered_percent', $cards['orders_by_fulfillment_status']);
        $this->assert_count_metric($cards['new_vs_returning_customers']['total']);
        $this->assertArrayHasKey('new_total', $cards['new_vs_returning_customers']);
        $this->assertArrayHasKey('returning_total', $cards['new_vs_returning_customers']);
        $this->assertSame(['date', 'label', 'span_label', 'new', 'returning', 'previous_date', 'previous_label', 'previous_span_label', 'previous_new', 'previous_returning'], array_keys($cards['new_vs_returning_customers']['series'][0]));
        $this->assertArrayHasKey('items', $cards['sales_by_coupon_code']);
        $this->assertArrayHasKey('countries', $cards['sales_by_location']);
        $this->assertArrayHasKey('items', $cards['sales_by_payment_method']);
        $this->assertArrayHasKey('items', $cards['taxes_by_region']);
        $this->assertArrayHasKey('items', $cards['shipping_charges_by_method']);
        foreach (['out_of_stock', 'low_stock', 'in_stock', 'lowest'] as $key) {
            $this->assertArrayHasKey($key, $cards['inventory_health']);
        }

        $payment = $cards['sales_by_payment_method']['items'][0];
        $this->assertSame(['id', 'name', 'orders', 'total_sales_money_object', 'previous_total_sales_money_object', 'change'], array_keys($payment));
        $this->assertSame(['short_display', 'raw', 'display', 'currency'], array_keys($payment['total_sales_money_object']));
        $this->assertSame(9000, $this->minor($cards['total_sales_over_time']['total']['current_money_object']));
    }

    /**
     * Scenario "One key only": the response has the meta and the data of that key only.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_one_key_returns_only_its_data_with_the_meta(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000);

        $payload = $this->metric('sales_by_coupon_code');

        $this->assertSame(['meta', 'data'], array_keys($payload));
        $this->assertSame(['range', 'compare', 'granularity', 'base_currency_code', 'has_orders', 'amount_example'], array_keys($payload['meta']));
        $this->assertTrue($payload['meta']['has_orders']);
        $this->assertSame('$20,345.00', $payload['meta']['amount_example']['display']);
        $this->assertSame('$20.3K', $payload['meta']['amount_example']['short_display']);
        $this->assertArrayNotHasKey('currencies', $payload['meta']);
        $this->assertSame(['items'], array_keys($payload['data']));
    }

    /**
     * Scenario "Key metrics key": the data has the eleven key metrics, each with its series.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_kpis_key_returns_the_key_metrics(): void
    {
        $this->make_sale('2026-10-01 10:00:00', 1000);

        $data = $this->metric('kpis')['data'];

        $this->assertSame(['gross_sales', 'orders', 'average_order_value', 'returning_customer_rate', 'net_sales', 'total_sales', 'items_ordered', 'discounts', 'new_customers', 'customers', 'shipping_charges'], array_keys($data));
        $this->assertSame(1, $data['orders']['current']);
        foreach ($data as $metric) {
            $this->assertCount(30, $metric['series']);
        }
    }

    /**
     * Every key in METRIC_KEYS answers with the meta and the data.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_every_metric_key_answers(): void
    {
        foreach (AnalyticsQueryService::METRIC_KEYS as $key) {
            $payload = $this->metric($key);

            $this->assertSame(['meta', 'data'], array_keys($payload), $key);
        }
    }

    /**
     * Scenario "Unknown key": the response is 404 and contains no data.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_key_is_404(): void
    {
        $payload = $this->assert_api_error($this->request('GET', 'analytics/metrics/profit', ['range' => 'last_30']), 404);

        $this->assertArrayNotHasKey('data', $payload);
    }

    /**
     * Scenario "Old overview endpoint": the route no longer exists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_old_overview_route_is_404(): void
    {
        $this->assert_api_error($this->request('GET', 'analytics/overview', ['range' => 'last_30']), 404);
    }

    /**
     * Assert a money metric: current and previous money objects and a change.
     *
     * @param array $metric Money metric from the response.
     *
     * @return void
     * @since 1.0.0
     */
    protected function assert_money_metric(array $metric): void
    {
        $this->assertArrayHasKey('current_money_object', $metric);
        $this->assertArrayHasKey('previous_money_object', $metric);
        $this->assertArrayHasKey('change', $metric);

        if ($metric['current_money_object'] !== null) {
            $this->assertSame(['short_display', 'raw', 'display', 'currency'], array_keys($metric['current_money_object']));
            $this->assertSame(['code', 'symbol'], array_keys($metric['current_money_object']['currency']));
        }
    }

    /**
     * Assert a count or rate metric: current, previous and a change.
     *
     * @param array $metric Count or rate metric from the response.
     *
     * @return void
     * @since 1.0.0
     */
    protected function assert_count_metric(array $metric): void
    {
        $this->assertArrayHasKey('current', $metric);
        $this->assertArrayHasKey('previous', $metric);
        $this->assertArrayHasKey('change', $metric);
    }
}
