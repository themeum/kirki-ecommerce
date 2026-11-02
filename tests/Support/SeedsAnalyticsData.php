<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;

/**
 * Seeds orders, refunds and customers for the analytics tests and calls the analytics endpoint.
 *
 * Every timestamp passed in is UTC, as the plugin saves them. "Today" is frozen with the
 * `kirki_ecommerce_analytics_today` filter (see the test contract in the analytics-foundation design).
 *
 * @since 1.0.0
 */
trait SeedsAnalyticsData
{
    /**
     * The frozen "today" used by every analytics test, in the site time zone.
     *
     * @var string
     */
    protected static $analytics_today = '2026-10-14';

    /**
     * Start from an empty store: no orders, refunds or customers.
     *
     * Plugin table state carries across tests in a class, so everything is removed here.
     *
     * @return void
     * @since 1.0.0
     */
    protected function reset_analytics_state(): void
    {
        Refund::query()->delete();
        OrderItem::query()->delete();
        Order::query()->delete();
        Customer::query()->delete();

        wp_cache_flush();

        update_option('timezone_string', 'UTC');
        update_option('start_of_week', 1);
        $this->freeze_today(static::$analytics_today);

        if (!Currency::query()->where('is_base', true)->exists()) {
            Currency::create(['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1, 'is_base' => true, 'is_active' => true]);
        }
    }

    /**
     * Freeze "today" (a Y-m-d date in the site time zone).
     *
     * @param string $date Date to use as today.
     *
     * @return void
     * @since 1.0.0
     */
    protected function freeze_today(string $date): void
    {
        remove_all_filters('kirki_ecommerce_analytics_today');
        add_filter('kirki_ecommerce_analytics_today', fn() => $date);
    }

    /**
     * Set the site time zone.
     *
     * @param string $timezone IANA time zone name.
     *
     * @return void
     * @since 1.0.0
     */
    protected function set_timezone(string $timezone): void
    {
        update_option('timezone_string', $timezone);
    }

    /**
     * Create an order with items. Timestamps are UTC strings.
     *
     * @param array       $attributes Order attributes.
     * @param array       $items      Item attributes, one array per item.
     * @param string|null $paid_at    Payment time, or null for none.
     * @param string|null $created_at Creation time, or null for now.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function make_order(array $attributes = [], array $items = [], ?string $paid_at = null, ?string $created_at = null): Order
    {
        $order = Order::create(array_merge([
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
            'payment_status' => PaymentStatus::PAID,
            'customer_email' => 'buyer-' . strtolower(wp_generate_password(8, false)) . '@example.com',
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

        $timestamps = ['paid_at' => $paid_at];

        if ($created_at !== null) {
            $timestamps['created_at'] = $created_at;
            $timestamps['updated_at'] = $created_at;
        }

        Order::query()->where('id', $order->id)->update($timestamps);

        return Order::find($order->id);
    }

    /**
     * Create a paid order with one item and no tax, shipping or discount.
     *
     * @param string $paid_at   Payment time, UTC.
     * @param int    $subtotal  Item subtotal and order total, in minor units.
     * @param array  $overrides Order attribute overrides.
     * @param int    $quantity  Item quantity.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function make_sale(string $paid_at, int $subtotal, array $overrides = [], int $quantity = 1): Order
    {
        return $this->make_order(array_merge([
            'base_subtotal' => $subtotal,
            'invoiced_subtotal' => $subtotal,
            'base_total' => $subtotal,
            'invoiced_total' => $subtotal,
            'items_count' => $quantity,
        ], $overrides), [[
            'quantity' => $quantity,
            'base_subtotal' => $subtotal,
            'invoiced_subtotal' => $subtotal,
            'base_total' => $subtotal,
            'invoiced_total' => $subtotal,
        ]], $paid_at, $paid_at);
    }

    /**
     * Record a refund on an order.
     *
     * @param Order       $order           Refunded order.
     * @param int         $invoiced_amount Amount in the order currency, in minor units.
     * @param string      $status          Refund status.
     * @param string|null $updated_at      Time the refund last changed, UTC.
     *
     * @return Refund
     * @since 1.0.0
     */
    protected function make_refund(Order $order, int $invoiced_amount, string $status, ?string $updated_at = null): Refund
    {
        $refund = Refund::create([
            'order_id' => $order->id,
            'status' => $status,
            'invoiced_amount' => $invoiced_amount,
        ]);

        if ($updated_at !== null) {
            Refund::query()->where('id', $refund->id)->update(['created_at' => $updated_at, 'updated_at' => $updated_at]);
        }

        return $refund;
    }

    /**
     * Get the payload of one analytics metric key for the given query parameters.
     *
     * @param string $key    Metric key.
     * @param array  $params Query parameters.
     *
     * @return array The meta and the data of the key.
     * @since 1.0.0
     */
    protected function metric(string $key, array $params = []): array
    {
        $params = array_merge(['range' => 'last_30', 'compare' => 'none'], $params);

        return $this->assert_api_success($this->request('GET', 'analytics/metrics/' . $key, $params))['data'];
    }

    /**
     * Get every analytics metric key and put them together as the meta, the key metrics and the cards.
     *
     * @param array $params Query parameters.
     *
     * @return array
     * @since 1.0.0
     */
    protected function overview(array $params = []): array
    {
        $kpis = $this->metric('kpis', $params);
        $cards = [];

        foreach (AnalyticsQueryService::METRIC_KEYS as $key) {
            if ($key !== 'kpis') {
                $cards[$key] = $this->metric($key, $params)['data'];
            }
        }

        return array_merge($kpis['meta'], ['kpis' => $kpis['data'], 'cards' => $cards]);
    }

    /**
     * Get the overview for one custom day range with no comparison.
     *
     * @param string $from First day, Y-m-d.
     * @param string $to   Last day, Y-m-d.
     * @param array  $more Extra query parameters.
     *
     * @return array
     * @since 1.0.0
     */
    protected function overview_between(string $from, string $to, array $more = []): array
    {
        return $this->overview(array_merge(['range' => 'custom', 'from' => $from, 'to' => $to], $more));
    }

    /**
     * Convert a money object to minor units.
     *
     * @param array|null $money_object Money object from the response.
     *
     * @return int|null
     * @since 1.0.0
     */
    protected function minor(?array $money_object): ?int
    {
        return $money_object === null ? null : (int) round($money_object['raw'] * 100);
    }

    /**
     * Find a row of the Total sales breakdown card by its key.
     *
     * @param array  $data Overview payload.
     * @param string $key  Row key.
     *
     * @return array
     * @since 1.0.0
     */
    protected function breakdown_row(array $data, string $key): array
    {
        $rows = array_column($data['cards']['total_sales_breakdown']['rows'], null, 'key');
        $this->assertArrayHasKey($key, $rows);

        return $rows[$key];
    }

    /**
     * Get one breakdown row's current amount in minor units.
     *
     * @param array  $data Overview payload.
     * @param string $key  Row key.
     *
     * @return int
     * @since 1.0.0
     */
    protected function breakdown_minor(array $data, string $key): int
    {
        return $this->minor($this->breakdown_row($data, $key)['current_money_object']);
    }
}
