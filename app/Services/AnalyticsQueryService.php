<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use DateTimeImmutable;
use DateTimeZone;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderTaxType;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\App\client_timezone;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\resource_path;

/**
 * Answers the Analytics page from the order, refund, customer, product and variant tables.
 *
 * Every figure is added up in minor units with SUM and COUNT when the request runs. A date range is turned
 * into UTC bounds, so the time indexes of the orders table are used. The local day of a row is
 * calculated in SQL from the UTC offsets that apply inside the range. Names are resolved after the
 * aggregation, so only the rows that are shown are looked up.
 *
 * @since 1.0.0
 */
class AnalyticsQueryService
{
    const PRODUCT_LIMIT = 5;

    const CATEGORY_LIMIT = 6;

    const LIST_LIMIT = 5;

    const LOWEST_STOCK_LIMIT = 4;

    const VARIANT_CHUNK_SIZE = 1000;

    const AMOUNT_EXAMPLE = '20345';

    const METRIC_KEYS = [
        'kpis',
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
    ];

    const WINDOW_KEYS = [
        'kpis',
        'total_sales_over_time',
        'total_sales_breakdown',
        'average_order_value_over_time',
        'orders_over_time',
        'new_vs_returning_customers',
    ];

    const FULFILLMENT_STATUSES = [
        FulfillmentStatus::UNFULFILLED,
        FulfillmentStatus::PROCESSING,
        FulfillmentStatus::ON_HOLD,
        FulfillmentStatus::SHIPPED,
        FulfillmentStatus::DELIVERED,
        FulfillmentStatus::RETURNED,
        FulfillmentStatus::CANCELLED,
    ];

    /** @var AnalyticsRangeResolver */
    protected $range_resolver;

    /** @var AvailabilityService */
    protected $availability_service;

    /** @var string */
    protected $table_prefix;

    /** @var string Base currency code of the store. */
    protected $base_currency;

    /**
     * Create the service.
     *
     * @since 1.0.0
     *
     * @param AnalyticsRangeResolver $range_resolver      Resolver of ranges and buckets.
     * @param AvailabilityService    $availability_service Resolver of stock statuses.
     */
    public function __construct(AnalyticsRangeResolver $range_resolver, AvailabilityService $availability_service)
    {
        $this->range_resolver = $range_resolver;
        $this->availability_service = $availability_service;
    }

    /**
     * Get the metrics of one key for a range and a comparison, with the page meta.
     *
     * @since 1.0.0
     *
     * @param string               $key    One of METRIC_KEYS.
     * @param array<string, mixed> $params Validated request parameters.
     *
     * @return array<string, mixed>
     */
    public function get_metric(string $key, array $params)
    {
        $this->table_prefix = DB::connection()->get_table_prefix();
        $this->base_currency = Money::get_base_currency();

        $range = $this->range_resolver->resolve($params);

        return [
            'meta' => $this->build_meta($range),
            'data' => in_array($key, static::WINDOW_KEYS, true)
                ? $this->build_window_metric($key, $range)
                : $this->build_range_metric($key, $range),
        ];
    }

    /**
     * Build the meta that every metric response shares.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<string, mixed>
     */
    protected function build_meta(array $range)
    {
        return [
            'range' => [
                'preset' => $range['preset'],
                'from' => $range['from'],
                'to' => $range['to'],
                'days' => $range['days'],
            ],
            'compare' => $range['compare'],
            'granularity' => $range['granularity'],
            'base_currency_code' => $this->base_currency,
            'has_orders' => $this->has_orders(),
            'amount_example' => $this->money(Money::to_minor(static::AMOUNT_EXAMPLE, $this->base_currency)),
        ];
    }

    /**
     * Build the metrics of a key that reads the window totals and series.
     *
     * @since 1.0.0
     *
     * @param string               $key   One of WINDOW_KEYS.
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<string, mixed>
     */
    protected function build_window_metric(string $key, array $range)
    {
        $current = $this->collect_window($range['from'], $range['to'], $range['buckets'], $range['granularity']);
        $previous = $range['compare'] !== null
            ? $this->collect_window($range['compare']['from'], $range['compare']['to'], $range['previous_buckets'], $range['granularity'])
            : null;
        $compared = $previous !== null;
        $now = $current['totals'];
        $before = $previous['totals'] ?? [];

        switch ($key) {
            case 'kpis':
                return $this->build_kpis($range, $current, $previous);
            case 'total_sales_over_time':
                return [
                    'total' => $this->money_metric($now['total_sales'], $before['total_sales'] ?? null, $compared),
                    'series' => $this->build_series($current, $previous, 'total_sales'),
                ];
            case 'total_sales_breakdown':
                return ['rows' => $this->build_breakdown($now, $before, $compared)];
            case 'average_order_value_over_time':
                return [
                    'total' => $this->money_metric($now['average_order_value'], $before['average_order_value'] ?? null, $compared),
                    'series' => $this->build_series($current, $previous, 'average_order_value'),
                ];
            case 'orders_over_time':
                return [
                    'total' => $this->count_metric($now['orders'], $before['orders'] ?? null, $compared),
                    'items_ordered' => $current['items_ordered'],
                    'series' => $this->build_series($current, $previous, 'orders'),
                ];
            default:
                return $this->build_new_vs_returning($current, $previous);
        }
    }

    /**
     * Build the metrics of a key that runs its own queries.
     *
     * @since 1.0.0
     *
     * @param string               $key   One of METRIC_KEYS that is not in WINDOW_KEYS.
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<string, mixed>
     */
    protected function build_range_metric(string $key, array $range)
    {
        switch ($key) {
            case 'sales_by_product':
                return ['items' => $this->build_sales_by_product($range)];
            case 'sales_by_category':
                return ['items' => $this->build_sales_by_category($range)];
            case 'orders_by_fulfillment_status':
                return $this->build_fulfillment_status($range);
            case 'sales_by_coupon_code':
                return ['items' => $this->build_sales_by_coupon($range)];
            case 'orders_by_time_of_day':
                return $this->build_orders_by_time_of_day($range);
            case 'sales_by_location':
                return ['countries' => $this->build_sales_by_location($range)];
            case 'sales_by_payment_method':
                return ['items' => $this->build_sales_by_payment_method($range)];
            case 'taxes_by_region':
                return ['items' => $this->build_taxes_by_region($range)];
            case 'shipping_charges_by_method':
                return ['items' => $this->build_shipping_by_method($range)];
            default:
                return $this->build_inventory_health();
        }
    }

    /**
     * Get the top regions of one country by Sales, Orders and Customers for a range and a comparison.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated request parameters, with the country code.
     *
     * @return array<string, mixed>
     */
    public function get_regions(array $params)
    {
        $this->table_prefix = DB::connection()->get_table_prefix();
        $this->base_currency = Money::get_base_currency();

        $range = $this->range_resolver->resolve($params);
        $country = strtoupper((string) $params['country']);
        $current = $this->merge_region_names($country, $this->query_location_metrics($this->utc_bounds($range['from'], $range['to']), $country));
        $previous = null;

        if ($range['compare'] !== null) {
            $previous = $this->merge_region_names($country, $this->query_location_metrics($this->utc_bounds($range['compare']['from'], $range['compare']['to']), $country));
        }

        $rows = [];

        foreach ($current as $name => $values) {
            $rows[] = array_merge(['name' => (string) $name], $this->location_values($values, $previous === null ? null : ($previous[$name] ?? [])));
        }

        return [
            'country' => $country,
            'sales' => $this->top_locations($rows, $current, 'sales'),
            'orders' => $this->top_locations($rows, $current, 'orders'),
            'customers' => $this->top_locations($rows, $current, 'customers'),
        ];
    }

    /**
     * Collect the totals and the bucket series of one window.
     *
     * @since 1.0.0
     *
     * @param string                           $from        First day.
     * @param string                           $to          Last day.
     * @param array<int, array<string, mixed>> $buckets     Chart buckets of the window.
     * @param string                           $granularity One of day, week or month.
     *
     * @return array<string, mixed>
     */
    protected function collect_window(string $from, string $to, array $buckets, string $granularity)
    {
        $bounds = $this->utc_bounds($from, $to);
        $sales_by_bucket = $this->query_sales($bounds, $granularity);
        $first_orders = $this->first_orders_sql($bounds);
        $customers_by_bucket = $this->query_customers($bounds, $granularity, $first_orders);
        $customer_totals = $this->query_customers($bounds, null, $first_orders)[''] ?? [];
        $returns_by_bucket = $this->query_returns($bounds, $granularity);
        $placed_by_bucket = $this->query_placed($bounds, $granularity);

        $series = [];

        foreach ($buckets as $bucket) {
            $key = $bucket['key'];
            $point_sales = array_merge($this->empty_sales(), $sales_by_bucket[$key] ?? [], $customers_by_bucket[$key] ?? []);
            $point_returns = (int) ($returns_by_bucket[$key] ?? 0);
            $point_placed = (int) ($placed_by_bucket[$key]['orders'] ?? 0);
            $point_items = (int) ($placed_by_bucket[$key]['items_ordered'] ?? 0);

            $series[] = [
                'date' => $bucket['start'],
                'label' => $bucket['label'],
                'span_label' => $bucket['span_label'],
                'metrics' => $this->summarize($point_sales, $point_returns, $point_placed, $point_items),
            ];
        }

        $totals_sales = array_merge($this->empty_sales(), $this->sum_rows($sales_by_bucket), $customer_totals);
        $items_ordered = (int) array_sum(array_column($placed_by_bucket, 'items_ordered'));

        return [
            'from' => $from,
            'to' => $to,
            'totals' => $this->summarize($totals_sales, (int) array_sum($returns_by_bucket), (int) array_sum(array_column($placed_by_bucket, 'orders')), $items_ordered),
            'items_ordered' => $items_ordered,
            'series' => $series,
        ];
    }

    /**
     * Add up the columns of rows that share the same keys.
     *
     * @since 1.0.0
     *
     * @param array<string, array<string, int>> $rows Rows keyed by bucket.
     *
     * @return array<string, int>
     */
    protected function sum_rows(array $rows)
    {
        $sums = [];

        foreach ($rows as $row) {
            foreach ($row as $column => $value) {
                $sums[$column] = ($sums[$column] ?? 0) + $value;
            }
        }

        return $sums;
    }

    /**
     * Derive the metrics of a period from its raw sums.
     *
     * @since 1.0.0
     *
     * @param array<string, int> $sales   Sales sums of the period.
     * @param int                $returns Returns of the period.
     * @param int                $placed  Placed orders of the period.
     * @param int                $items   Items ordered in the placed orders of the period.
     *
     * @return array<string, int|float|null>
     */
    protected function summarize(array $sales, int $returns, int $placed, int $items)
    {
        $net_sales = $sales['gross'] - $sales['discounts'] - $returns;
        $paid_orders = $sales['paid_orders'];

        return [
            'gross_sales' => $sales['gross'],
            'discounts' => $sales['discounts'],
            'returns' => $returns,
            'net_sales' => $net_sales,
            'shipping' => $sales['shipping'],
            'taxes' => $sales['taxes'],
            'total_sales' => $net_sales + $sales['shipping'] + $sales['taxes'],
            'paid_orders' => $paid_orders,
            'orders' => $placed,
            'items_ordered' => $items,
            'average_order_value' => $paid_orders > 0 ? $this->divide_half_up($sales['gross'] - $sales['discounts'], $paid_orders) : null,
            'customers' => $sales['customers'],
            'new_customers' => $sales['new_customers'],
            'returning_customers' => $sales['returning_customers'],
            'returning_customer_rate' => $sales['customers'] > 0 ? round($sales['returning_customers'] / $sales['customers'] * 100, 1) : null,
        ];
    }

    /**
     * Get zero sums for a period without sales.
     *
     * @since 1.0.0
     *
     * @return array<string, int>
     */
    protected function empty_sales()
    {
        return [
            'paid_orders' => 0, 'gross' => 0, 'discounts' => 0, 'shipping' => 0, 'taxes' => 0,
            'customers' => 0, 'new_customers' => 0, 'returning_customers' => 0,
        ];
    }

    /**
     * Sum the sales orders of a window, in total or by chart bucket.
     *
     * Gross and Net sales come from the items of each order through a correlated subquery on the order_id key,
     * so an order is counted once whatever its number of items.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $bounds      UTC bounds of the window.
     * @param string|null          $granularity Chart granularity, or null for one total.
     *
     * @return array<string, array<string, int>> Sums keyed by bucket key; the key is an empty string for a total.
     */
    protected function query_sales(array $bounds, $granularity)
    {
        [$scope, $bindings] = $this->sales_scope('o', $bounds);
        $bucket = $granularity === null ? "''" : $this->bucket_sql($this->local_date_sql($this->sales_time('o'), $bounds), $granularity);

        $rows = DB::connection()->select(
            "SELECT {$bucket} AS bucket_key, COUNT(*) AS paid_orders,
                    COALESCE(SUM({$this->item_sum_sql('o', 'subtotal')}), 0) AS gross,
                    COALESCE(SUM({$this->item_sum_sql('o', 'net')}), 0) AS net,
                    COALESCE(SUM({$this->shipping_sql('o')}), 0) AS shipping,
                    COALESCE(SUM(o.base_tax_total), 0) AS taxes
                FROM {$this->table('orders')} o
                WHERE {$scope}
                GROUP BY bucket_key",
            $bindings
        );

        $sums = [];

        foreach ($rows as $row) {
            $gross = (int) $row['gross'];
            $sums[(string) $row['bucket_key']] = [
                'paid_orders' => (int) $row['paid_orders'],
                'gross' => $gross,
                'discounts' => $gross - (int) $row['net'],
                'shipping' => (int) $row['shipping'],
                'taxes' => (int) $row['taxes'],
            ];
        }

        return $sums;
    }

    /**
     * Count the customers, the new customers and the returning customers of the sales orders of a window.
     *
     * The customer key is calculated in SQL (see customer_key_sql()). A customer is new in a period when the
     * first paid order is in it, and returning when another sales order is in it.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $bounds      UTC bounds of the window.
     * @param string|null          $granularity Chart granularity, or null for one total.
     * @param array{0: string, 1: array<int, mixed>} $first_orders The first-paid SQL and its bindings, from first_orders_sql(), built once per window.
     *
     * @return array<string, array<string, int>> Counts keyed by bucket key; the key is an empty string for a total.
     */
    protected function query_customers(array $bounds, $granularity, array $first_orders)
    {
        [$scope, $bindings] = $this->sales_scope('o', $bounds);
        [$first_orders, $first_bindings] = $first_orders;
        $time = $this->sales_time('o');
        $bucket = $granularity === null ? "''" : $this->bucket_sql('s.local_date', $granularity);
        $group = $granularity === null ? '' : 'GROUP BY bucket_key';

        $rows = DB::connection()->select(
            "SELECT {$bucket} AS bucket_key, COUNT(DISTINCT s.customer_key) AS customers,
                    COUNT(DISTINCT CASE WHEN COALESCE(s.order_time_id = f.first_time_id, 1) = 1 THEN s.customer_key END) AS new_customers,
                    COUNT(DISTINCT CASE WHEN COALESCE(s.order_time_id = f.first_time_id, 1) = 0 THEN s.customer_key END) AS returning_customers
                FROM (
                    SELECT {$this->local_date_sql($time, $bounds)} AS local_date, {$this->customer_key_sql('o')} AS customer_key,
                           {$this->order_time_id_sql('o')} AS order_time_id
                    FROM {$this->table('orders')} o
                    WHERE {$scope}
                ) s
                LEFT JOIN ({$first_orders}) f ON f.customer_key = s.customer_key
                {$group}",
            array_merge($bindings, $first_bindings)
        );

        $counts = [];

        foreach ($rows as $row) {
            $counts[(string) $row['bucket_key']] = [
                'customers' => (int) $row['customers'],
                'new_customers' => (int) $row['new_customers'],
                'returning_customers' => (int) $row['returning_customers'],
            ];
        }

        return $counts;
    }

    /**
     * Get the SQL of the first paid order of every customer that has a sales order in a window.
     *
     * The derived table reads the sales orders of all time that belong to the customers of the window. They are
     * found through the indexed customer_id column, and through the trimmed customer_email, so a guest email with
     * extra spaces still matches. The email branch reads the sales orders without an index on the trimmed email. It reads orders in every order
     * currency, because the first paid order is the first one in any currency.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $bounds UTC bounds of the window.
     *
     * @return array{0: string, 1: array<int, mixed>} The SQL and its bindings.
     */
    protected function first_orders_sql(array $bounds)
    {
        $orders = $this->table('orders');
        $customers = $this->table('customers');
        [$window, $window_bindings] = $this->sales_scope('r', $bounds);
        $status = $this->sales_status_sql('o2');
        $key = $this->customer_key_sql('o2');
        $time_id = $this->order_time_id_sql('o2');

        $window_ids = "SELECT r.customer_id FROM {$orders} r WHERE r.customer_id IS NOT NULL AND {$window}";
        $window_emails = "SELECT TRIM(r.customer_email) FROM {$orders} r WHERE r.customer_email IS NOT NULL AND {$window}";
        // Joined as a derived table: MySQL 5.7 and MariaDB cannot semi-join an IN subquery that holds a UNION.
        $email_table = "SELECT TRIM(r.customer_email) AS email FROM {$orders} r WHERE r.customer_email IS NOT NULL AND {$window}
            UNION SELECT ce.email FROM {$customers} ce WHERE ce.id IN ({$window_ids})";
        $branches = [
            ['', "o2.customer_id IN ({$window_ids})", 0, 1],
            ['', "o2.customer_id IN (SELECT ce.id FROM {$customers} ce WHERE ce.email IN ({$window_emails}))", 0, 1],
            ["INNER JOIN ({$email_table}) w ON w.email = TRIM(o2.customer_email)", '1 = 1', 2, 0],
        ];
        $selects = [];
        $bindings = [];

        // $join_count and $where_count are the number of times the window bindings appear in the join and in the WHERE.
        foreach ($branches as [$join, $branch, $join_count, $where_count]) {
            $selects[] = "SELECT {$key} AS customer_key, {$time_id} AS order_time_id FROM {$orders} o2 {$join}
                WHERE {$status} AND o2.base_currency_code = %s AND {$branch}";

            for ($index = 0; $index < $join_count; $index++) {
                $bindings = array_merge($bindings, $window_bindings);
            }

            $bindings[] = $this->base_currency;

            for ($index = 0; $index < $where_count; $index++) {
                $bindings = array_merge($bindings, $window_bindings);
            }
        }

        return [
            'SELECT x.customer_key, MIN(x.order_time_id) AS first_time_id FROM (' . implode(' UNION ALL ', $selects) . ') x GROUP BY x.customer_key',
            $bindings,
        ];
    }

    /**
     * Get the SQL for the customer key of an order.
     *
     * The key is c:<customer id> for a registered customer, whether the order has the customer_id or only a
     * customer_email that matches a customer, else e:<trimmed lower-cased email>, else o:<order id>.
     *
     * @since 1.0.0
     *
     * @param string $alias Alias of the orders table.
     *
     * @return string
     */
    protected function customer_key_sql(string $alias)
    {
        $customers = $this->table('customers');

        return "CASE WHEN {$alias}.customer_id IS NOT NULL THEN CONCAT('c:', {$alias}.customer_id)
            ELSE COALESCE(
                CONCAT('c:', (SELECT MIN(ce.id) FROM {$customers} ce WHERE ce.email = TRIM({$alias}.customer_email))),
                CASE WHEN TRIM(COALESCE({$alias}.customer_email, '')) <> '' THEN CONCAT('e:', LOWER(TRIM({$alias}.customer_email))) ELSE CONCAT('o:', {$alias}.id) END
            ) END";
    }

    /**
     * Get the SQL for a sortable value of the sales date and the ID of an order.
     *
     * The smallest value is the first paid order: the earliest sales date, ties broken by the lowest order ID.
     *
     * @since 1.0.0
     *
     * @param string $alias Alias of the orders table.
     *
     * @return string
     */
    protected function order_time_id_sql(string $alias)
    {
        return "CONCAT(CAST({$this->sales_time($alias)} AS CHAR), LPAD({$alias}.id, 20, '0'))";
    }

    /**
     * Sum the completed refunds of a window by their last update, in total or by chart bucket.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $bounds      UTC bounds of the window.
     * @param string|null          $granularity Chart granularity, or null for one total.
     *
     * @return array<string, int> Returned amounts keyed by bucket key; the key is an empty string for a total.
     */
    protected function query_returns(array $bounds, $granularity)
    {
        $bucket = $granularity === null ? "''" : $this->bucket_sql($this->local_date_sql('r.updated_at', $bounds), $granularity);
        $amount = 'CASE WHEN o.invoiced_total = 0 THEN 0 ELSE (2 * r.invoiced_amount * o.base_total + o.invoiced_total) DIV (2 * o.invoiced_total) END';
        $order_scope = $this->order_currency_sql('o');

        $rows = DB::connection()->select(
            "SELECT {$bucket} AS bucket_key, COALESCE(SUM({$amount}), 0) AS returned_amount
                FROM {$this->table('refunds')} r
                INNER JOIN {$this->table('orders')} o ON o.id = r.order_id
                WHERE r.status = %s AND r.updated_at >= %s AND r.updated_at < %s
                    AND {$this->sales_status_sql('o')} AND {$order_scope[0]}
                GROUP BY bucket_key",
            array_merge([RefundStatus::COMPLETED, $bounds['start'], $bounds['end']], $order_scope[1])
        );

        $sums = [];

        foreach ($rows as $row) {
            $sums[(string) $row['bucket_key']] = (int) $row['returned_amount'];
        }

        return $sums;
    }

    /**
     * Count the placed orders of a window by their order date, in total or by chart bucket.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $bounds      UTC bounds of the window.
     * @param string|null          $granularity Chart granularity, or null for one total.
     *
     * @return array<string, array<string, int>> Counts keyed by bucket key; the key is an empty string for a total.
     */
    protected function query_placed(array $bounds, $granularity)
    {
        [$scope, $bindings] = $this->placed_scope('o', $bounds);
        $bucket = $granularity === null ? "''" : $this->bucket_sql($this->local_date_sql('o.created_at', $bounds), $granularity);

        $rows = DB::connection()->select(
            "SELECT {$bucket} AS bucket_key, COUNT(*) AS orders, COALESCE(SUM(o.items_count), 0) AS items_ordered
                FROM {$this->table('orders')} o
                WHERE {$scope}
                GROUP BY bucket_key",
            $bindings
        );

        $sums = [];

        foreach ($rows as $row) {
            $sums[(string) $row['bucket_key']] = ['orders' => (int) $row['orders'], 'items_ordered' => (int) $row['items_ordered']];
        }

        return $sums;
    }

    /**
     * Get the UTC bounds of a range of local days.
     *
     * @since 1.0.0
     *
     * @param string $from First day.
     * @param string $to   Last day.
     *
     * @return array{start: string, end: string, start_ts: int, end_ts: int} The start (included) and the end (excluded) as UTC date-times and as timestamps.
     */
    protected function utc_bounds(string $from, string $to)
    {
        $zone = client_timezone();
        $utc = new DateTimeZone('UTC');
        $start = (new DateTimeImmutable($from . ' 00:00:00', $zone))->setTimezone($utc);
        // Add the day to the date in UTC, then build local midnight, so a DST gap at midnight cannot shift the bound.
        $next_day = (new DateTimeImmutable($to, $utc))->modify('+1 day')->format('Y-m-d');
        $end = (new DateTimeImmutable($next_day . ' 00:00:00', $zone))->setTimezone($utc);

        return [
            'start' => $start->format('Y-m-d H:i:s'),
            'end' => $end->format('Y-m-d H:i:s'),
            'start_ts' => $start->getTimestamp(),
            'end_ts' => $end->getTimestamp(),
        ];
    }

    /**
     * Get the SQL for the local day of a UTC time column.
     *
     * @since 1.0.0
     *
     * @param string               $column Time column or expression in UTC.
     * @param array<string, mixed> $bounds UTC bounds of the window.
     *
     * @return string SQL expression giving a DATE.
     */
    protected function local_date_sql(string $column, array $bounds)
    {
        return sprintf('DATE(%s)', $this->local_time_sql($column, $bounds));
    }

    /**
     * Get the SQL for the local date-time of a UTC time column.
     *
     * The UTC offsets that apply inside the window come from the time zone transitions, so daylight saving
     * time and half-hour offsets are exact without the MySQL time zone tables.
     *
     * @since 1.0.0
     *
     * @param string               $column Time column or expression in UTC.
     * @param array<string, mixed> $bounds UTC bounds of the window.
     *
     * @return string SQL expression giving a DATETIME.
     */
    protected function local_time_sql(string $column, array $bounds)
    {
        $zone = client_timezone();
        $transitions = $zone->getTransitions($bounds['start_ts'], $bounds['end_ts']);
        $parts = [];

        if (is_array($transitions)) {
            foreach ($transitions as $transition) {
                $parts[] = [(int) $transition['ts'], (int) $transition['offset']];
            }
        }

        if (empty($parts)) {
            $parts[] = [$bounds['start_ts'], $zone->getOffset(new DateTimeImmutable('@' . $bounds['start_ts']))];
        }

        if (count($parts) === 1) {
            return sprintf('DATE_ADD(%s, INTERVAL %d SECOND)', $column, $parts[0][1]);
        }

        $cases = '';

        for ($index = 1; $index < count($parts); $index++) {
            $cases .= sprintf(" WHEN %s < '%s' THEN %d", $column, gmdate('Y-m-d H:i:s', $parts[$index][0]), $parts[$index - 1][1]);
        }

        return sprintf('DATE_ADD(%s, INTERVAL CASE%s ELSE %d END SECOND)', $column, $cases, $parts[count($parts) - 1][1]);
    }

    /**
     * Get the SQL for the chart bucket key of a local date.
     *
     * @since 1.0.0
     *
     * @param string $date_sql    SQL expression giving a DATE.
     * @param string $granularity One of day, week or month.
     *
     * @return string SQL expression giving the day, the week start day or the first day of the month.
     */
    protected function bucket_sql(string $date_sql, string $granularity)
    {
        if ($granularity === AnalyticsRangeResolver::GRANULARITY_WEEK) {
            $start_of_week = (int) get_option('start_of_week', 1);

            return "DATE_SUB({$date_sql}, INTERVAL MOD(DAYOFWEEK({$date_sql}) - 1 - {$start_of_week} + 7, 7) DAY)";
        }

        if ($granularity === AnalyticsRangeResolver::GRANULARITY_MONTH) {
            return "DATE_SUB({$date_sql}, INTERVAL DAYOFMONTH({$date_sql}) - 1 DAY)";
        }

        return $date_sql;
    }

    /**
     * Get the SQL for the sales time of an order: the payment time, else the creation time.
     *
     * @since 1.0.0
     *
     * @param string $alias Alias of the orders table.
     *
     * @return string
     */
    protected function sales_time(string $alias)
    {
        return "COALESCE({$alias}.paid_at, {$alias}.created_at)";
    }

    /**
     * Get the SQL that limits orders to sales orders (paid, refunding or refunded).
     *
     * @since 1.0.0
     *
     * @param string $alias Alias of the orders table.
     *
     * @return string
     */
    protected function sales_status_sql(string $alias)
    {
        return sprintf("%s.payment_status IN ('%s', '%s', '%s')", $alias, PaymentStatus::PAID, PaymentStatus::REFUNDING, PaymentStatus::REFUNDED);
    }

    /**
     * Get the SQL that limits orders to the current base currency.
     *
     * @since 1.0.0
     *
     * @param string $alias Alias of the orders table.
     *
     * @return array{0: string, 1: string[]} The SQL condition and its bindings.
     */
    protected function order_currency_sql(string $alias)
    {
        return ["{$alias}.base_currency_code = %s", [$this->base_currency]];
    }

    /**
     * Get the SQL that limits orders to the sales orders of a window.
     *
     * The sales date is paid_at, else created_at when paid_at is empty. Both ranges use a time index.
     *
     * @since 1.0.0
     *
     * @param string               $alias  Alias of the orders table.
     * @param array<string, mixed> $bounds UTC bounds of the window.
     *
     * @return array{0: string, 1: string[]} The SQL condition and its bindings.
     */
    protected function sales_scope(string $alias, array $bounds)
    {
        [$currency_sql, $bindings] = $this->order_currency_sql($alias);
        $sql = sprintf(
            '%s AND %s AND ((%3$s.paid_at >= %%s AND %3$s.paid_at < %%s) OR (%3$s.paid_at IS NULL AND %3$s.created_at >= %%s AND %3$s.created_at < %%s))',
            $this->sales_status_sql($alias),
            $currency_sql,
            $alias
        );

        return [$sql, array_merge($bindings, [$bounds['start'], $bounds['end'], $bounds['start'], $bounds['end']])];
    }

    /**
     * Get the SQL that limits orders to the placed orders of a window (not failed, created inside the window).
     *
     * @since 1.0.0
     *
     * @param string               $alias  Alias of the orders table.
     * @param array<string, mixed> $bounds UTC bounds of the window.
     *
     * @return array{0: string, 1: string[]} The SQL condition and its bindings.
     */
    protected function placed_scope(string $alias, array $bounds)
    {
        [$currency_sql, $bindings] = $this->order_currency_sql($alias);
        $sql = sprintf("%1\$s.payment_status <> '%2\$s' AND %3\$s AND %1\$s.created_at >= %%s AND %1\$s.created_at < %%s", $alias, PaymentStatus::FAILED, $currency_sql);

        return [$sql, array_merge($bindings, [$bounds['start'], $bounds['end']])];
    }

    /**
     * Get the SQL for the sum of one item column of an order, read through the order_id key.
     *
     * @since 1.0.0
     *
     * @param string $alias  Alias of the orders table.
     * @param string $column One of subtotal (before discounts) or net (after discounts, without tax).
     *
     * @return string
     */
    protected function item_sum_sql(string $alias, string $column)
    {
        $expression = $column === 'subtotal' ? 'i.base_subtotal' : 'i.base_total - i.base_tax_total';

        return "(SELECT SUM({$expression}) FROM {$this->table('order_items')} i WHERE i.order_id = {$alias}.id)";
    }

    /**
     * Get the SQL for the shipping charges of an order, without the shipping tax.
     *
     * @since 1.0.0
     *
     * @param string $alias Alias of the orders table.
     *
     * @return string
     */
    protected function shipping_sql(string $alias)
    {
        return "{$alias}.base_shipping_total - {$alias}.base_shipping_tax_amount";
    }

    /**
     * Get the full name of a plugin table.
     *
     * @since 1.0.0
     *
     * @param string $name Table name without the plugin prefix.
     *
     * @return string
     */
    protected function table(string $name)
    {
        return $this->table_prefix . 'kirki_ecommerce_' . $name;
    }

    /**
     * Divide two whole numbers and round half up.
     *
     * @since 1.0.0
     *
     * @param int $numerator   Numerator.
     * @param int $denominator Denominator, above zero.
     *
     * @return int
     */
    protected function divide_half_up(int $numerator, int $denominator)
    {
        if ($numerator < 0) {
            return -intdiv(2 * -$numerator + $denominator, 2 * $denominator);
        }

        return intdiv(2 * $numerator + $denominator, 2 * $denominator);
    }

    /**
     * Get the percent change between two values.
     *
     * @since 1.0.0
     *
     * @param int|float|null $current  Current value.
     * @param int|float|null $previous Comparison value.
     *
     * @return float|null Percent rounded to one decimal, or null when there is nothing to compare.
     */
    protected function change($current, $previous)
    {
        if ($current === null || $previous === null || (float) $previous === 0.0) {
            return null;
        }

        return round(($current - $previous) / $previous * 100, 1);
    }

    /**
     * Build a money object in the base currency.
     *
     * @since 1.0.0
     *
     * @param int $minor_amount Amount in minor units.
     *
     * @return \Kirki\Ecommerce\App\DTO\ShortMoneyDTO
     */
    protected function money(int $minor_amount)
    {
        return Money::to_short_dto($minor_amount, $this->base_currency);
    }

    /**
     * Build a money metric with its comparison and change.
     *
     * @since 1.0.0
     *
     * @param int|null      $current  Current amount in minor units.
     * @param int|null      $previous Comparison amount, or null.
     * @param bool          $compared Whether a comparison range is set.
     *
     * @return array<string, mixed>
     */
    protected function money_metric($current, $previous, bool $compared)
    {
        return [
            'current_money_object' => $current === null ? null : $this->money($current),
            'previous_money_object' => $compared && $previous !== null ? $this->money($previous) : null,
            'change' => $compared ? $this->change($current, $previous) : null,
        ];
    }

    /**
     * Build a count or rate metric with its comparison and change.
     *
     * @since 1.0.0
     *
     * @param int|float|null $current  Current value.
     * @param int|float|null $previous Comparison value, or null.
     * @param bool           $compared Whether a comparison range is set.
     *
     * @return array<string, mixed>
     */
    protected function count_metric($current, $previous, bool $compared)
    {
        return [
            'current' => $current,
            'previous' => $compared ? $previous : null,
            'change' => $compared ? $this->change($current, $previous) : null,
        ];
    }

    /**
     * Build the series of a metric, with the comparison series matched by position.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>      $current_window  Current window.
     * @param array<string, mixed>|null $previous_window Comparison window, or null.
     * @param string                    $metric          Metric name from summarize().
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_series(array $current_window, $previous_window, string $metric)
    {
        $points = [];

        foreach ($current_window['series'] as $index => $point) {
            $previous = $previous_window['series'][$index] ?? null;

            $points[] = [
                'date' => $point['date'],
                'label' => $point['label'],
                'span_label' => $point['span_label'],
                'value' => $point['metrics'][$metric],
                'previous_date' => $previous['date'] ?? null,
                'previous_label' => $previous['label'] ?? null,
                'previous_span_label' => $previous['span_label'] ?? null,
                'previous_value' => $previous['metrics'][$metric] ?? null,
            ];
        }

        return $points;
    }

    /**
     * Build the key metrics.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>      $range    Resolved range.
     * @param array<string, mixed>      $current  Current window.
     * @param array<string, mixed>|null $previous Comparison window, or null.
     *
     * @return array<string, array<string, mixed>>
     */
    protected function build_kpis(array $range, array $current, $previous)
    {
        $compared = $previous !== null;
        $now = $current['totals'];
        $before = $previous['totals'] ?? [];

        return [
            'gross_sales' => array_merge(
                $this->money_metric($now['gross_sales'], $before['gross_sales'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'gross_sales')]
            ),
            'orders' => array_merge(
                $this->count_metric($now['orders'], $before['orders'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'orders')]
            ),
            'average_order_value' => array_merge(
                $this->money_metric($now['average_order_value'], $before['average_order_value'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'average_order_value')]
            ),
            'returning_customer_rate' => array_merge(
                $this->count_metric($now['returning_customer_rate'], $before['returning_customer_rate'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'returning_customer_rate')]
            ),
            'net_sales' => array_merge(
                $this->money_metric($now['net_sales'], $before['net_sales'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'net_sales')]
            ),
            'total_sales' => array_merge(
                $this->money_metric($now['total_sales'], $before['total_sales'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'total_sales')]
            ),
            'items_ordered' => array_merge(
                $this->count_metric($now['items_ordered'], $before['items_ordered'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'items_ordered')]
            ),
            'discounts' => array_merge(
                $this->money_metric($now['discounts'], $before['discounts'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'discounts')]
            ),
            'new_customers' => array_merge(
                $this->count_metric($now['new_customers'], $before['new_customers'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'new_customers')]
            ),
            'customers' => array_merge(
                $this->count_metric($now['customers'], $before['customers'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'customers')]
            ),
            'shipping_charges' => array_merge(
                $this->money_metric($now['shipping'], $before['shipping'] ?? null, $compared),
                ['series' => $this->build_series($current, $previous, 'shipping')]
            ),
        ];
    }

    /**
     * Build the rows of the Total sales breakdown card.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $now      Current totals.
     * @param array<string, mixed> $before   Comparison totals.
     * @param bool                 $compared Whether a comparison range is set.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_breakdown(array $now, array $before, bool $compared)
    {
        $rows = [];

        foreach (['gross_sales', 'discounts', 'returns', 'net_sales', 'shipping', 'taxes', 'total_sales'] as $key) {
            $rows[] = array_merge(['key' => $key], $this->money_metric($now[$key], $before[$key] ?? null, $compared));
        }

        return $rows;
    }

    /**
     * Build the New vs returning customers card.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>      $current  Current window.
     * @param array<string, mixed>|null $previous Comparison window, or null.
     *
     * @return array<string, mixed>
     */
    protected function build_new_vs_returning(array $current, $previous)
    {
        $compared = $previous !== null;
        $series = [];

        foreach ($current['series'] as $index => $point) {
            $before = $previous['series'][$index] ?? null;

            $series[] = [
                'date' => $point['date'],
                'label' => $point['label'],
                'span_label' => $point['span_label'],
                'new' => $point['metrics']['new_customers'],
                'returning' => $point['metrics']['returning_customers'],
                'previous_date' => $before['date'] ?? null,
                'previous_label' => $before['label'] ?? null,
                'previous_span_label' => $before['span_label'] ?? null,
                'previous_new' => $before['metrics']['new_customers'] ?? null,
                'previous_returning' => $before['metrics']['returning_customers'] ?? null,
            ];
        }

        return [
            'total' => $this->count_metric($current['totals']['customers'], $previous['totals']['customers'] ?? null, $compared),
            'new_total' => $current['totals']['new_customers'],
            'returning_total' => $current['totals']['returning_customers'],
            'series' => $series,
        ];
    }

    /**
     * Build the Orders by fulfillment status card.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<string, mixed>
     */
    protected function build_fulfillment_status(array $range)
    {
        [$scope, $bindings] = $this->placed_scope('o', $this->utc_bounds($range['from'], $range['to']));

        $rows = DB::connection()->select(
            "SELECT o.fulfillment_status AS status, COUNT(*) AS orders
                FROM {$this->table('orders')} o
                WHERE {$scope}
                GROUP BY o.fulfillment_status",
            $bindings
        );

        $counts = array_column($rows, 'orders', 'status');
        $total_orders = (int) array_sum($counts);
        $items = [];

        foreach (static::FULFILLMENT_STATUSES as $status) {
            $count = (int) ($counts[$status] ?? 0);
            $items[] = [
                'status' => $status,
                'count' => $count,
                'percent' => $total_orders > 0 ? round($count / $total_orders * 100, 1) : 0.0,
            ];
        }

        $delivered = array_column($items, 'percent', 'status')[FulfillmentStatus::DELIVERED];

        return ['total_orders' => $total_orders, 'delivered_percent' => $delivered, 'items' => $items];
    }

    /**
     * Build the Sales by product card: the top products by Net sales.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_sales_by_product(array $range)
    {
        $group_key = $this->product_group_key_sql();
        $net = 'i.base_total - i.base_tax_total';
        [$scope, $bindings] = $this->sales_scope('o', $this->utc_bounds($range['from'], $range['to']));

        $rows = DB::connection()->select(
            sprintf(
                "SELECT %s AS group_key, MAX(p.id) AS product_id, MAX(i.id) AS latest_item_id,
                        SUM(i.quantity) AS units_sold, SUM(%s) AS net_sales
                    FROM %s i INNER JOIN %s o ON o.id = i.order_id
                    LEFT JOIN %s p ON p.id = i.product_id
                    WHERE %s
                    GROUP BY group_key ORDER BY net_sales DESC, units_sold DESC, group_key ASC LIMIT %d",
                $group_key,
                $net,
                $this->table('order_items'),
                $this->table('orders'),
                $this->table('products'),
                $scope,
                static::PRODUCT_LIMIT
            ),
            $bindings
        );

        if (empty($rows)) {
            return [];
        }

        $previous_net = $range['compare'] === null ? [] : $this->query_previous_product_net($range['compare'], $rows);
        $latest_items = $this->fetch_latest_items(array_map('intval', array_column($rows, 'latest_item_id')));
        $product_ids = array_values(array_filter(array_map('intval', array_column($rows, 'product_id'))));
        $titles = $this->fetch_product_titles($product_ids);
        $stock = $this->fetch_product_stock($product_ids);
        $items = [];

        foreach ($rows as $row) {
            $product_id = $row['product_id'] === null ? null : (int) $row['product_id'];
            $latest = $latest_items[(int) $row['latest_item_id']] ?? [];
            $net_sales = (int) $row['net_sales'];
            $previous = $range['compare'] === null ? null : (int) ($previous_net[$row['group_key']] ?? 0);

            $items[] = array_merge([
                'product_id' => $product_id,
                'name' => $titles[$product_id] ?? ($latest['product_name'] ?? ''),
                'image' => MediaAttachment::make($latest['product_image'] ?? null),
                'is_deleted' => $product_id === null,
                'units_sold' => (int) $row['units_sold'],
                'net_sales_money_object' => $this->money($net_sales),
                'previous_net_sales_money_object' => $previous === null ? null : $this->money($previous),
                'change' => $this->change($net_sales, $previous),
            ], $stock[$product_id] ?? ['availability_status' => null, 'track_inventory' => false, 'inventory' => 0]);
        }

        return $items;
    }

    /**
     * Sum the Net sales of the shown products in the comparison range.
     *
     * @since 1.0.0
     *
     * @param array<string, string>            $compare Comparison range.
     * @param array<int, array<string, mixed>> $rows    Top product rows of the current range.
     *
     * @return array<string, int> Net sales keyed by product group key.
     */
    protected function query_previous_product_net(array $compare, array $rows)
    {
        $group_key = $this->product_group_key_sql();
        $net = 'i.base_total - i.base_tax_total';
        [$scope, $bindings] = $this->sales_scope('o', $this->utc_bounds($compare['from'], $compare['to']));
        $product_ids = [];
        $names = [];

        foreach ($rows as $row) {
            if ($row['product_id'] === null) {
                $names[] = substr($row['group_key'], 2);
            } else {
                $product_ids[] = (int) $row['product_id'];
            }
        }

        $conditions = [];
        $condition_bindings = [];

        if (!empty($product_ids)) {
            $conditions[] = 'p.id IN (' . implode(', ', array_fill(0, count($product_ids), '%d')) . ')';
            $condition_bindings = array_merge($condition_bindings, $product_ids);
        }

        if (!empty($names)) {
            $conditions[] = '(p.id IS NULL AND i.product_name IN (' . implode(', ', array_fill(0, count($names), '%s')) . '))';
            $condition_bindings = array_merge($condition_bindings, $names);
        }

        $previous_rows = DB::connection()->select(
            sprintf(
                "SELECT %s AS group_key, SUM(%s) AS net_sales
                    FROM %s i INNER JOIN %s o ON o.id = i.order_id
                    LEFT JOIN %s p ON p.id = i.product_id
                    WHERE %s AND (%s)
                    GROUP BY group_key",
                $group_key,
                $net,
                $this->table('order_items'),
                $this->table('orders'),
                $this->table('products'),
                $scope,
                implode(' OR ', $conditions)
            ),
            array_merge($bindings, $condition_bindings)
        );

        return array_map('intval', array_column($previous_rows, 'net_sales', 'group_key'));
    }

    /**
     * Get the SQL for the group key of an order item: the product, or the saved name when the product is deleted.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function product_group_key_sql()
    {
        return "CASE WHEN p.id IS NULL THEN CONCAT('n:', i.product_name) ELSE CONCAT('p:', p.id) END";
    }

    /**
     * Read the saved name and image of order items.
     *
     * @since 1.0.0
     *
     * @param int[] $item_ids Order item IDs.
     *
     * @return array<int, array<string, mixed>> Item columns keyed by item ID.
     */
    protected function fetch_latest_items(array $item_ids)
    {
        if (empty($item_ids)) {
            return [];
        }

        $rows = DB::connection()->select(
            sprintf('SELECT id, product_name, product_image FROM %s WHERE id IN (%s)', $this->table('order_items'), implode(', ', array_fill(0, count($item_ids), '%d'))),
            $item_ids
        );

        return array_column($rows, null, 'id');
    }

    /**
     * Read the current titles of products.
     *
     * @since 1.0.0
     *
     * @param int[] $product_ids Product IDs.
     *
     * @return array<int, string> Titles keyed by product ID.
     */
    protected function fetch_product_titles(array $product_ids)
    {
        if (empty($product_ids)) {
            return [];
        }

        $rows = DB::connection()->select(
            sprintf('SELECT id, title FROM %s WHERE id IN (%s)', $this->table('products'), implode(', ', array_fill(0, count($product_ids), '%d'))),
            $product_ids
        );

        return array_column($rows, 'title', 'id');
    }

    /**
     * Get the live stock summary of products.
     *
     * The inventory is the summed non-negative available quantity of the variants that track inventory.
     *
     * @since 1.0.0
     *
     * @param int[] $product_ids Product IDs.
     *
     * @return array<int, array<string, mixed>> Stock fields keyed by product ID.
     */
    protected function fetch_product_stock(array $product_ids)
    {
        if (empty($product_ids)) {
            return [];
        }

        $variants = Variant::query()
            ->where_in('product_id', $product_ids)
            ->get(['id', 'product_id', 'track_inventory', 'in_stock', 'available_quantity', 'low_stock_threshold'])
            ->all();

        $by_product = [];

        foreach ($variants as $variant) {
            $by_product[(int) $variant->product_id][] = $variant;
        }

        $threshold = (int) Settings::get('product.low_stock_threshold', 0);
        $stock = [];

        foreach ($by_product as $product_id => $product_variants) {
            $track_inventory = false;
            $inventory = 0;

            foreach ($product_variants as $variant) {
                if ($variant->track_inventory) {
                    $track_inventory = true;
                    $inventory += max((int) $variant->available_quantity, 0);
                }
            }

            $stock[$product_id] = [
                'availability_status' => $this->availability_service->resolve_product_status($product_variants, $threshold),
                'track_inventory' => $track_inventory,
                'inventory' => $inventory,
            ];
        }

        return $stock;
    }

    /**
     * Build the Sales by category card: the top categories by Net sales.
     *
     * A product counts once in each category it is in now. Products in no category, and deleted products, count under Uncategorized.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_sales_by_category(array $range)
    {
        $current = $this->query_category_net($range['from'], $range['to']);

        if (empty($current)) {
            return [];
        }

        $previous = $range['compare'] === null ? null : $this->query_category_net($range['compare']['from'], $range['compare']['to']);
        $ids = array_values(array_filter(array_keys($current), function ($category_id) {
            return $category_id !== '';
        }));
        $names = [];

        if (!empty($ids)) {
            $rows = DB::connection()->select(
                sprintf('SELECT id, name FROM %s WHERE id IN (%s)', $this->table('categories'), implode(', ', array_fill(0, count($ids), '%d'))),
                array_map('intval', $ids)
            );
            $names = array_column($rows, 'name', 'id');
        }

        $rows = [];

        foreach ($current as $category_id => $net_sales) {
            $category_id = (string) $category_id;
            $rows[] = [
                'category_id' => $category_id,
                'name' => $category_id === '' ? __('Uncategorized', 'kirki-ecommerce') : ($names[$category_id] ?? ''),
                'net_sales' => $net_sales,
            ];
        }

        usort($rows, function ($first, $second) {
            return [$second['net_sales'], $first['name']] <=> [$first['net_sales'], $second['name']];
        });

        return array_map(function ($row) use ($previous) {
            $previous_net = $previous === null ? null : (int) ($previous[$row['category_id']] ?? 0);

            return [
                'category_id' => $row['category_id'] === '' ? null : (int) $row['category_id'],
                'name' => $row['name'],
                'net_sales_money_object' => $this->money($row['net_sales']),
                'previous_net_sales_money_object' => $previous_net === null ? null : $this->money($previous_net),
                'change' => $this->change($row['net_sales'], $previous_net),
            ];
        }, array_slice($rows, 0, static::CATEGORY_LIMIT));
    }

    /**
     * Sum the Net sales of items by category in a window.
     *
     * @since 1.0.0
     *
     * @param string $from First day.
     * @param string $to   Last day.
     *
     * @return array<string, int> Net sales keyed by category ID; an empty string key is Uncategorized.
     */
    protected function query_category_net(string $from, string $to)
    {
        $net = 'i.base_total - i.base_tax_total';
        [$scope, $bindings] = $this->sales_scope('o', $this->utc_bounds($from, $to));

        $categorized = DB::connection()->select(
            sprintf(
                'SELECT cp.category_id AS category_id, SUM(%s) AS net_sales
                    FROM %s i INNER JOIN %s o ON o.id = i.order_id
                    INNER JOIN %s cp ON cp.product_id = i.product_id
                    WHERE %s
                    GROUP BY cp.category_id',
                $net,
                $this->table('order_items'),
                $this->table('orders'),
                $this->table('category_product'),
                $scope
            ),
            $bindings
        );

        $uncategorized = DB::connection()->select(
            sprintf(
                'SELECT COUNT(*) AS item_count, COALESCE(SUM(%s), 0) AS net_sales
                    FROM %s i INNER JOIN %s o ON o.id = i.order_id
                    LEFT JOIN %s cp ON cp.product_id = i.product_id
                    WHERE %s AND cp.product_id IS NULL',
                $net,
                $this->table('order_items'),
                $this->table('orders'),
                $this->table('category_product'),
                $scope
            ),
            $bindings
        );

        $sums = [];

        foreach ($categorized as $row) {
            $sums[(string) $row['category_id']] = (int) $row['net_sales'];
        }

        if ((int) $uncategorized[0]['item_count'] > 0) {
            $sums[''] = (int) $uncategorized[0]['net_sales'];
        }

        return $sums;
    }

    /**
     * Build the Sales by coupon code card: the top codes by orders.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_sales_by_coupon(array $range)
    {
        $rows = $this->query_coupon_orders($range['from'], $range['to'], static::LIST_LIMIT);

        if (empty($rows)) {
            return [];
        }

        $previous = null;

        if ($range['compare'] !== null) {
            $previous = array_column($this->query_coupon_orders($range['compare']['from'], $range['compare']['to']), 'orders', 'code');
        }

        return array_map(function ($row) use ($previous) {
            $previous_orders = $previous === null ? null : (int) ($previous[$row['code']] ?? 0);

            return [
                'code' => $row['code'],
                'orders' => (int) $row['orders'],
                'discount_given_money_object' => $this->money((int) $row['discount_given']),
                'previous_orders' => $previous_orders,
                'change' => $this->change((int) $row['orders'], $previous_orders),
            ];
        }, $rows);
    }

    /**
     * Count the paid orders and the discount given by coupon code in a window.
     *
     * @since 1.0.0
     *
     * @param string   $from  First day.
     * @param string   $to    Last day.
     * @param int|null $limit Most codes to return, or null for all.
     *
     * @return array<int, array<string, mixed>> Rows with code, orders and discount_given, most orders first.
     */
    protected function query_coupon_orders(string $from, string $to, $limit = null)
    {
        [$scope, $bindings] = $this->sales_scope('o', $this->utc_bounds($from, $to));
        $amount = 'c.base_discount_amount';

        return DB::connection()->select(
            sprintf(
                'SELECT c.code AS code, COUNT(*) AS orders, COALESCE(SUM(%s), 0) AS discount_given
                    FROM %s c INNER JOIN %s o ON o.id = c.order_id
                    WHERE %s
                    GROUP BY c.code ORDER BY orders DESC, discount_given DESC, code ASC%s',
                $amount,
                $this->table('order_coupons'),
                $this->table('orders'),
                $scope,
                $limit === null ? '' : sprintf(' LIMIT %d', $limit)
            ),
            $bindings
        );
    }

    /**
     * Build the Orders by time of day card: the placed orders by local weekday and hour.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array{current: int[][], previous: int[][]|null}
     */
    protected function build_orders_by_time_of_day(array $range)
    {
        $previous = null;

        if ($range['compare'] !== null) {
            $previous = $this->query_orders_by_time_of_day($this->utc_bounds($range['compare']['from'], $range['compare']['to']));
        }

        return [
            'current' => $this->query_orders_by_time_of_day($this->utc_bounds($range['from'], $range['to'])),
            'previous' => $previous,
        ];
    }

    /**
     * Count the placed orders of a window by the local weekday and hour of their order date.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $bounds UTC bounds of the window.
     *
     * @return int[][] 7 rows from Monday to Sunday, each with 24 counts from hour 0 to hour 23.
     */
    protected function query_orders_by_time_of_day(array $bounds)
    {
        [$scope, $bindings] = $this->placed_scope('o', $bounds);
        $local_time = $this->local_time_sql('o.created_at', $bounds);

        $rows = DB::connection()->select(
            "SELECT WEEKDAY({$local_time}) AS weekday, HOUR({$local_time}) AS hour, COUNT(*) AS orders
                FROM {$this->table('orders')} o
                WHERE {$scope}
                GROUP BY weekday, hour",
            $bindings
        );

        $counts = array_fill(0, 7, array_fill(0, 24, 0));

        foreach ($rows as $row) {
            $counts[(int) $row['weekday']][(int) $row['hour']] = (int) $row['orders'];
        }

        return $counts;
    }

    /**
     * Build the Sales by location card: Sales, Orders and Customers of every country with orders.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_sales_by_location(array $range)
    {
        $current = $this->query_location_metrics($this->utc_bounds($range['from'], $range['to']));
        $previous = null;

        if ($range['compare'] !== null) {
            $previous = $this->query_location_metrics($this->utc_bounds($range['compare']['from'], $range['compare']['to']));
        }

        unset($current['']);
        ksort($current);
        $rows = [];

        foreach ($current as $code => $values) {
            $code = (string) $code;
            $country = CountryData::find_index_entry($code);

            $rows[] = array_merge(
                [
                    'code' => $code,
                    'numeric_code' => $country['numeric_code'] ?? null,
                    'name' => $country['name'] ?? $code,
                ],
                $this->location_values($values, $previous === null ? null : ($previous[$code] ?? []))
            );
        }

        return $rows;
    }

    /**
     * Calculate Sales, Orders and Customers of a window by location country, or by location state of one country.
     *
     * The location is the shipping address, else the billing address when the order has no shipping country.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $bounds  UTC bounds of the window.
     * @param string|null          $country Country code to group by state, or null to group by country.
     *
     * @return array<string, array<string, int>> Sales (minor units), orders and customers keyed by country code or saved state.
     */
    protected function query_location_metrics(array $bounds, $country = null)
    {
        $group = $this->location_sql('o', $country === null ? 'country' : 'state');
        $filter = $country === null ? '' : " AND {$this->location_sql('o', 'country')} = %s";
        $filter_bindings = $country === null ? [] : [$country];
        [$sales_scope, $sales_bindings] = $this->sales_scope('o', $bounds);
        [$placed_scope, $placed_bindings] = $this->placed_scope('o', $bounds);

        $sales_rows = DB::connection()->select(
            "SELECT {$group} AS location, COALESCE(SUM({$this->item_sum_sql('o', 'net')}), 0) AS sales,
                    COUNT(DISTINCT {$this->customer_key_sql('o')}) AS customers
                FROM {$this->table('orders')} o
                WHERE {$sales_scope}{$filter}
                GROUP BY location",
            array_merge($sales_bindings, $filter_bindings)
        );
        $placed_rows = DB::connection()->select(
            "SELECT {$group} AS location, COUNT(*) AS orders
                FROM {$this->table('orders')} o
                WHERE {$placed_scope}{$filter}
                GROUP BY location",
            array_merge($placed_bindings, $filter_bindings)
        );

        $metrics = [];
        $empty = ['sales' => 0, 'orders' => 0, 'customers' => 0];

        foreach ($sales_rows as $row) {
            $key = (string) $row['location'];
            $metrics[$key] = array_merge($metrics[$key] ?? $empty, ['sales' => (int) $row['sales'], 'customers' => (int) $row['customers']]);
        }

        foreach ($placed_rows as $row) {
            $key = (string) $row['location'];
            $metrics[$key] = array_merge($metrics[$key] ?? $empty, ['orders' => (int) $row['orders']]);
        }

        return $metrics;
    }

    /**
     * Get the SQL for one field of the location address of an order.
     *
     * @since 1.0.0
     *
     * @param string $alias Alias of the orders table.
     * @param string $field One of country or state.
     *
     * @return string
     */
    protected function location_sql(string $alias, string $field)
    {
        return "CASE WHEN COALESCE({$alias}.shipping_country, '') <> '' THEN COALESCE({$alias}.shipping_{$field}, '')
            ELSE COALESCE({$alias}.billing_{$field}, '') END";
    }

    /**
     * Merge the metrics of saved states that name the same region, such as "TX" and "Texas".
     *
     * Customers are added up, so a customer with orders under two saved values of one region counts twice.
     *
     * @since 1.0.0
     *
     * @param string                            $country Country code.
     * @param array<string, array<string, int>> $metrics Metrics keyed by saved state.
     *
     * @return array<string, array<string, int>> Metrics keyed by region name.
     */
    protected function merge_region_names(string $country, array $metrics)
    {
        $merged = [];

        foreach ($metrics as $state => $values) {
            $state = (string) $state;
            $name = $state === '' ? __('Unknown region', 'kirki-ecommerce') : $this->get_state_name($country, $state);

            foreach ($values as $metric => $value) {
                $merged[$name][$metric] = ($merged[$name][$metric] ?? 0) + $value;
            }
        }

        return $merged;
    }

    /**
     * Build the Sales, Orders and Customers values of a location, with their changes.
     *
     * @since 1.0.0
     *
     * @param array<string, int>      $values   Current metrics.
     * @param array<string, int>|null $previous Comparison metrics, or null when no comparison is set.
     *
     * @return array<string, mixed>
     */
    protected function location_values(array $values, $previous)
    {
        $before = function ($metric) use ($previous) {
            return $previous === null ? null : (int) ($previous[$metric] ?? 0);
        };

        return [
            'sales_money_object' => $this->money($values['sales']),
            'sales_change' => $this->change($values['sales'], $before('sales')),
            'orders' => $values['orders'],
            'orders_change' => $this->change($values['orders'], $before('orders')),
            'customers' => $values['customers'],
            'customers_change' => $this->change($values['customers'], $before('customers')),
        ];
    }

    /**
     * Get the top locations by one metric, leaving out locations with no value for it.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>>  $rows    Location rows, in the same order as the metrics.
     * @param array<string, array<string, int>> $metrics Metrics keyed by location name.
     * @param string                            $metric  One of sales, orders or customers.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function top_locations(array $rows, array $metrics, string $metric)
    {
        $rows = array_values(array_filter($rows, function ($row) use ($metrics, $metric) {
            return $metrics[$row['name']][$metric] > 0;
        }));

        usort($rows, function ($first, $second) use ($metrics, $metric) {
            return [$metrics[$second['name']][$metric], $first['name']] <=> [$metrics[$first['name']][$metric], $second['name']];
        });

        return array_slice($rows, 0, static::LIST_LIMIT);
    }

    /**
     * Build the Sales by payment method card: the top methods by Total sales.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_sales_by_payment_method(array $range)
    {
        $rows = $this->query_payment_method_sales($range['from'], $range['to'], static::LIST_LIMIT);
        $previous = null;

        if ($range['compare'] !== null && !empty($rows)) {
            $previous = array_column($this->query_payment_method_sales($range['compare']['from'], $range['compare']['to']), 'total_sales', 'id');
        }

        $ids = array_column($rows, 'id');
        $saved_names = $this->fetch_saved_names('payment_provider', 'payment_metadata', $ids);
        $items = [];

        foreach ($rows as $row) {
            $provider = Payment::get_provider($row['id']);
            $total_sales = (int) $row['total_sales'];
            $previous_total_sales = $previous === null ? null : (int) ($previous[$row['id']] ?? 0);
            $items[] = [
                'id' => $row['id'],
                'name' => $provider ? $provider->title() : ($saved_names[$row['id']] ?? $row['id']),
                'orders' => (int) $row['orders'],
                'total_sales_money_object' => $this->money($total_sales),
                'previous_total_sales_money_object' => $previous_total_sales === null ? null : $this->money($previous_total_sales),
                'change' => $this->change($total_sales, $previous_total_sales),
            ];
        }

        return $items;
    }

    /**
     * Sum the Total sales and count the sales orders by payment method in a window.
     *
     * @since 1.0.0
     *
     * @param string   $from  First day.
     * @param string   $to    Last day.
     * @param int|null $limit Most methods to return, or null for all.
     *
     * @return array<int, array<string, mixed>> Rows with id, orders and total_sales, most Total sales first.
     */
    protected function query_payment_method_sales(string $from, string $to, $limit = null)
    {
        [$scope, $bindings] = $this->sales_scope('o', $this->utc_bounds($from, $to));

        return DB::connection()->select(
            sprintf(
                "SELECT o.payment_provider AS id, COUNT(*) AS orders,
                        COALESCE(SUM(%1\$s + o.base_tax_total + %2\$s), 0) AS total_sales
                    FROM %3\$s o
                    WHERE %4\$s AND o.payment_provider IS NOT NULL
                    GROUP BY o.payment_provider ORDER BY total_sales DESC, orders DESC, id ASC%5\$s",
                $this->item_sum_sql('o', 'net'),
                $this->shipping_sql('o'),
                $this->table('orders'),
                $scope,
                $limit === null ? '' : sprintf(' LIMIT %d', $limit)
            ),
            $bindings
        );
    }

    /**
     * Build the Shipping charges by method card: the top methods by Shipping charges.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_shipping_by_method(array $range)
    {
        $rows = $this->query_shipping_method_charges($range['from'], $range['to'], static::LIST_LIMIT);
        $previous = null;

        if ($range['compare'] !== null && !empty($rows)) {
            $previous = array_column($this->query_shipping_method_charges($range['compare']['from'], $range['compare']['to']), 'shipping_charges', 'id');
        }

        $current_names = [];

        foreach (app()->make(ShippingService::class)->get_all_shipping_methods() as $method) {
            $current_names[$method['id']] = $method['name'];
        }

        $saved_names = $this->fetch_saved_names('shipping_method', 'shipping_metadata', array_column($rows, 'id'));
        $items = [];

        foreach ($rows as $row) {
            $shipping_charges = (int) $row['shipping_charges'];
            $previous_shipping_charges = $previous === null ? null : (int) ($previous[$row['id']] ?? 0);
            $items[] = [
                'id' => $row['id'],
                'name' => $current_names[$row['id']] ?? ($saved_names[$row['id']] ?? $row['id']),
                'orders' => (int) $row['orders'],
                'shipping_charges_money_object' => $this->money($shipping_charges),
                'previous_shipping_charges_money_object' => $previous_shipping_charges === null ? null : $this->money($previous_shipping_charges),
                'change' => $this->change($shipping_charges, $previous_shipping_charges),
            ];
        }

        return $items;
    }

    /**
     * Sum the Shipping charges and count the sales orders by shipping method in a window.
     *
     * @since 1.0.0
     *
     * @param string   $from  First day.
     * @param string   $to    Last day.
     * @param int|null $limit Most methods to return, or null for all.
     *
     * @return array<int, array<string, mixed>> Rows with id, orders and shipping_charges, most Shipping charges first.
     */
    protected function query_shipping_method_charges(string $from, string $to, $limit = null)
    {
        [$scope, $bindings] = $this->sales_scope('o', $this->utc_bounds($from, $to));

        return DB::connection()->select(
            sprintf(
                'SELECT o.shipping_method AS id, COUNT(*) AS orders, COALESCE(SUM(%1$s), 0) AS shipping_charges
                    FROM %2$s o
                    WHERE %3$s AND o.shipping_method IS NOT NULL
                    GROUP BY o.shipping_method ORDER BY shipping_charges DESC, orders DESC, id ASC%4$s',
                $this->shipping_sql('o'),
                $this->table('orders'),
                $scope,
                $limit === null ? '' : sprintf(' LIMIT %d', $limit)
            ),
            $bindings
        );
    }

    /**
     * Read the names saved in the newest order's metadata of each payment provider or shipping method.
     *
     * @since 1.0.0
     *
     * @param string   $column          Order column holding the provider or method ID.
     * @param string   $metadata_column Order column holding the metadata JSON.
     * @param string[] $ids             Provider or method IDs.
     *
     * @return array<string, string> Saved names keyed by ID.
     */
    protected function fetch_saved_names(string $column, string $metadata_column, array $ids)
    {
        if (empty($ids)) {
            return [];
        }

        $orders = $this->table('orders');
        $rows = DB::connection()->select(
            sprintf(
                'SELECT %1$s AS id, %2$s AS metadata FROM %3$s WHERE id IN (SELECT MAX(id) FROM %3$s WHERE %1$s IN (%4$s) GROUP BY %1$s)',
                $column,
                $metadata_column,
                $orders,
                implode(', ', array_fill(0, count($ids), '%s'))
            ),
            array_values($ids)
        );

        $key = $column === 'payment_provider' ? 'payment_provider' : 'shipping_method';
        $names = [];

        foreach ($rows as $row) {
            $metadata = json_decode((string) $row['metadata'], true);
            $name = is_array($metadata) ? ($metadata[$key]['name'] ?? null) : null;

            if (!empty($name)) {
                $names[$row['id']] = $name;
            }
        }

        return $names;
    }

    /**
     * Build the Taxes collected by region card: the top shipping regions by Total tax.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $range Resolved range.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_taxes_by_region(array $range)
    {
        $rows = $this->query_region_taxes($range['from'], $range['to'], static::LIST_LIMIT);
        $previous = null;

        if ($range['compare'] !== null && !empty($rows)) {
            $previous = [];

            foreach ($this->query_region_taxes($range['compare']['from'], $range['compare']['to']) as $row) {
                $previous[$row['country'] . '|' . $row['state']] = (int) $row['total_tax'];
            }
        }

        return array_map(function ($row) use ($previous) {
            $total_tax = (int) $row['total_tax'];
            $previous_total_tax = $previous === null ? null : ($previous[$row['country'] . '|' . $row['state']] ?? 0);

            return [
                'country' => $row['country'],
                'state' => $row['state'],
                'name' => $this->get_region_name($row['country'], $row['state']),
                'product_tax_money_object' => $this->money((int) $row['product_tax']),
                'shipping_tax_money_object' => $this->money((int) $row['shipping_tax']),
                'total_tax_money_object' => $this->money($total_tax),
                'previous_total_tax_money_object' => $previous_total_tax === null ? null : $this->money($previous_total_tax),
                'change' => $this->change($total_tax, $previous_total_tax),
            ];
        }, $rows);
    }

    /**
     * Sum the product, shipping and total tax of the sales orders by shipping region in a window.
     *
     * @since 1.0.0
     *
     * @param string   $from  First day.
     * @param string   $to    Last day.
     * @param int|null $limit Most regions to return, or null for all.
     *
     * @return array<int, array<string, mixed>> Rows with country, state, product_tax, shipping_tax and total_tax, most Total tax first.
     */
    protected function query_region_taxes(string $from, string $to, $limit = null)
    {
        $amount = 't.base_amount';
        [$scope, $bindings] = $this->sales_scope('o', $this->utc_bounds($from, $to));

        return DB::connection()->select(
            sprintf(
                "SELECT COALESCE(o.shipping_country, '') AS country, COALESCE(o.shipping_state, '') AS state,
                        COALESCE(SUM(CASE WHEN t.type = %%s THEN %1\$s ELSE 0 END), 0) AS product_tax,
                        COALESCE(SUM(CASE WHEN t.type = %%s THEN %1\$s ELSE 0 END), 0) AS shipping_tax,
                        COALESCE(SUM(%1\$s), 0) AS total_tax
                    FROM %2\$s t INNER JOIN %3\$s o ON o.id = t.order_id
                    WHERE %4\$s
                    GROUP BY country, state ORDER BY total_tax DESC, country ASC, state ASC%5\$s",
                $amount,
                $this->table('order_taxes'),
                $this->table('orders'),
                $scope,
                $limit === null ? '' : sprintf(' LIMIT %d', $limit)
            ),
            array_merge([OrderTaxType::PRODUCT, OrderTaxType::SHIPPING], $bindings)
        );
    }

    /**
     * Get the name of a shipping region, such as "Texas, United States".
     *
     * @since 1.0.0
     *
     * @param string $country_code Country code.
     * @param string $state        State ID, name or code saved on the order.
     *
     * @return string
     */
    protected function get_region_name(string $country_code, string $state)
    {
        $country = $country_code === '' ? null : CountryData::find_index_entry($country_code);
        $country_name = $country['name'] ?? ($country_code !== '' ? $country_code : __('Unknown', 'kirki-ecommerce'));

        if ($state === '') {
            return $country_name;
        }

        return $this->get_state_name($country_code, $state) . ', ' . $country_name;
    }

    /**
     * Get the name of a state from the ID, the name or the code saved on an order.
     *
     * @since 1.0.0
     *
     * @param string $country_code Country code.
     * @param string $state        State ID, name or code.
     *
     * @return string The state name, or the saved value when no state matches.
     */
    protected function get_state_name(string $country_code, string $state)
    {
        $states = CountryData::states_for($country_code);
        $wanted = strtolower($state);

        foreach ($states as $candidate) {
            if ((string) $candidate['id'] === $state || strtolower($candidate['name']) === $wanted) {
                return $candidate['name'];
            }
        }

        return $this->get_state_code_names($country_code)[strtoupper($state)] ?? $state;
    }

    /**
     * Get the state names by state code, for orders that saved a state code.
     *
     * @since 1.0.0
     *
     * @param string $country_code Country code.
     *
     * @return array<string, string> State names keyed by upper-case state code.
     */
    protected function get_state_code_names(string $country_code)
    {
        if (strtoupper($country_code) !== 'US') {
            return [];
        }

        return require resource_path('data/us-state-codes.php');
    }

    /**
     * Build the Inventory health card from the variants as they are now.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function build_inventory_health()
    {
        $threshold = (int) Settings::get('product.low_stock_threshold', 0);
        $counts = ['out_of_stock' => 0, 'low_stock' => 0, 'in_stock' => 0];
        $tracked = [];
        $last_id = 0;

        do {
            $variants = Variant::query()
                ->where('id', '>', $last_id)
                ->order_by('id')
                ->limit(static::VARIANT_CHUNK_SIZE)
                ->get(['id', 'product_id', 'track_inventory', 'in_stock', 'available_quantity', 'low_stock_threshold'])
                ->all();

            foreach ($variants as $variant) {
                $last_id = (int) $variant->id;
                $status = $this->availability_service->resolve_variant_status($variant, $threshold);
                $counts[$status] = ($counts[$status] ?? 0) + 1;

                if ($variant->track_inventory && $status !== AvailabilityStatus::IN_STOCK) {
                    $tracked[] = [(int) $variant->available_quantity, $last_id];
                    sort($tracked);
                    $tracked = array_slice($tracked, 0, static::LOWEST_STOCK_LIMIT);
                }
            }
        } while (count($variants) === static::VARIANT_CHUNK_SIZE);

        return array_merge($counts, ['lowest' => $this->fetch_lowest_variants($tracked, $threshold)]);
    }

    /**
     * Read the details of the variants with the lowest stock.
     *
     * @since 1.0.0
     *
     * @param array<int, int[]> $lowest    Pairs of available quantity and variant ID, lowest first.
     * @param int               $threshold Store default low-stock threshold.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function fetch_lowest_variants(array $lowest, int $threshold)
    {
        if (empty($lowest)) {
            return [];
        }

        $variants = Variant::query()
            ->with(['product', 'attribute_values'])
            ->where_in('id', array_column($lowest, 1))
            ->get()
            ->key_by('id')
            ->all();

        $items = [];

        foreach ($lowest as [$quantity, $variant_id]) {
            $variant = $variants[$variant_id] ?? null;

            if ($variant === null) {
                continue;
            }

            $labels = $variant->attribute_values
                ->map(function ($attribute_value) {
                    return $attribute_value->value ?? $attribute_value->color;
                })
                ->filter()
                ->values()
                ->all();

            $items[] = [
                'variant_id' => $variant_id,
                'product_id' => (int) $variant->product_id,
                'product_name' => $variant->product->title ?? '',
                'variant_name' => empty($labels) ? null : implode(' / ', $labels),
                'available_quantity' => $quantity,
                'status' => $this->availability_service->resolve_variant_status($variant, $threshold),
            ];
        }

        return $items;
    }

    /**
     * Check whether the store has any sales order or placed order in the current base currency.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    protected function has_orders()
    {
        $rows = DB::connection()->select(
            sprintf("SELECT id FROM %s WHERE payment_status <> '%s' AND base_currency_code = %%s LIMIT 1", $this->table('orders'), PaymentStatus::FAILED),
            [$this->base_currency]
        );

        return !empty($rows);
    }
}
