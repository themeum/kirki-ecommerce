<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Mcp\Concerns\ReadsAnalyticsRange;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

use function Kirki\Ecommerce\App\client_timezone;

/**
 * Gives the sales of the store for a date range, with the same numbers as the Analytics page.
 *
 * @since 1.0.0
 */
class SalesReportTool extends StoreReadTool
{
    use ReadsAnalyticsRange;

    const MONEY_TOTALS = ['gross_sales', 'discounts', 'returns', 'net_sales', 'shipping', 'taxes', 'total_sales'];

    const COUNT_TOTALS = ['orders', 'items_ordered', 'customers', 'new_customers'];

    /** @var string */
    protected $description = 'Get the sales report of the store for a date range: gross, net and total sales, discounts, returns, shipping, taxes, average order value, orders, items, customers, and a sales and orders series over the range. '
        . 'Map the request to "range": "today" → today, "yesterday" → yesterday, "last 7 days" or "this week so far" → last_7, "last 30 days" or "last month" → last_30, "last 90 days" or "last quarter" → last_90, "last 12 months" or "last year" → last_12_months, "this month" → month_to_date, "this year" → year_to_date. '
        . 'For any other period use "custom" with "from" and "to" (Y-m-d, the end not after today). '
        . 'Send "compare" only when the user asks to compare with an earlier period.';

    /** @var AnalyticsQueryService */
    protected $query_service;

    /** @var AnalyticsRangeResolver */
    protected $range_resolver;

    /**
     * Create the tool with the analytics services.
     *
     * @since 1.0.0
     *
     * @param AnalyticsQueryService  $query_service  Service that answers the Analytics page.
     * @param AnalyticsRangeResolver $range_resolver Resolver of ranges and of today.
     */
    public function __construct(AnalyticsQueryService $query_service, AnalyticsRangeResolver $range_resolver)
    {
        $this->query_service = $query_service;
        $this->range_resolver = $range_resolver;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function input_schema(JsonSchema $schema)
    {
        return $this->range_schema($schema);
    }

    /**
     * Build the sales report of the requested range.
     *
     * @since 1.0.0
     *
     * @param Request $request Tool arguments.
     *
     * @return Response
     * @throws ValidationException When an argument is not valid.
     */
    public function handle(Request $request)
    {
        $params = $this->validate_range($request->all());

        $kpis = $this->query_service->get_metric('kpis', $params);
        $breakdown = $this->query_service->get_metric('total_sales_breakdown', $params);

        return Response::structured($this->build_report($kpis, $breakdown));
    }

    /**
     * Build the report from the KPI and breakdown metrics of the Analytics page.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $kpis      Result of the kpis metric.
     * @param array<string, mixed> $breakdown Result of the total_sales_breakdown metric.
     *
     * @return array<string, mixed>
     */
    protected function build_report(array $kpis, array $breakdown)
    {
        $meta = $kpis['meta'];
        $cards = $kpis['data'];
        $rows = array_column($breakdown['data']['rows'], null, 'key');

        $totals = [];

        foreach (static::MONEY_TOTALS as $key) {
            $totals[$key] = $this->money_total($rows[$key]);
        }

        $totals['average_order_value'] = $this->money_total($cards['average_order_value']);

        foreach (static::COUNT_TOTALS as $key) {
            $totals[$key] = [
                'current' => $cards[$key]['current'],
                'previous' => $cards[$key]['previous'],
                'change' => $cards[$key]['change'],
            ];
        }

        return [
            'range' => $meta['range'],
            'compare' => $meta['compare'],
            'granularity' => $meta['granularity'],
            'time_zone' => client_timezone()->getName(),
            'currency' => $meta['base_currency_code'],
            'has_orders' => $meta['has_orders'],
            'totals' => $totals,
            'series' => $this->build_series($cards['total_sales']['series'], $cards['orders']['series'], $meta['compare'] !== null),
        ];
    }

    /**
     * Join the total sales and orders series into one point per bucket.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $sales_series  Total sales points, in minor units.
     * @param array<int, array<string, mixed>> $orders_series Orders points.
     * @param bool                             $compared      Whether the report has a comparison.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_series(array $sales_series, array $orders_series, bool $compared)
    {
        $points = [];

        foreach ($sales_series as $index => $sales_point) {
            $orders_point = $orders_series[$index];

            $point = [
                'date' => $sales_point['date'],
                'label' => $sales_point['label'],
                'total_sales' => Money::prepare_amount_from_minor((int) $sales_point['value']),
                'orders' => $orders_point['value'],
            ];

            if ($compared) {
                $point['previous_date'] = $sales_point['previous_date'];
                $point['previous_total_sales'] = $sales_point['previous_value'] === null ? null : Money::prepare_amount_from_minor((int) $sales_point['previous_value']);
                $point['previous_orders'] = $orders_point['previous_value'];
            }

            $points[] = $point;
        }

        return $points;
    }
}
