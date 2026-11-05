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

/**
 * Gives total sales, orders and average order value over time, with the same numbers as the Analytics page.
 *
 * @since 1.0.0
 */
class SalesTrendTool extends StoreReadTool
{
    use ReadsAnalyticsRange;

    /** @var string */
    protected $description = 'Get the sales trend of the store for a date range: total sales, orders and average order value for each day, week or month, and the totals of the range. '
        . 'Use it for questions such as "how did sales change this month?" or "which day had the most orders?". '
        . 'The range arguments are the same as in the sales report tool. Send "compare" only when the user asks to compare with an earlier period.';

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
     * Build the sales trend of the requested range.
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
        $kpis = $this->query_service->get_metric('kpis', $this->validate_range($request->all()));
        $cards = $kpis['data'];

        return Response::structured(array_merge($this->range_result($kpis['meta']), [
            'granularity' => $kpis['meta']['granularity'],
            'totals' => [
                'total_sales' => $this->money_total($cards['total_sales']),
                'orders' => [
                    'current' => $cards['orders']['current'],
                    'previous' => $cards['orders']['previous'],
                    'change' => $cards['orders']['change'],
                ],
                'average_order_value' => $this->money_total($cards['average_order_value']),
            ],
            'series' => $this->build_series($cards, $kpis['meta']['compare'] !== null),
        ]));
    }

    /**
     * Join the total sales, orders and average order value series into one point per bucket.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $cards    KPI cards with their series.
     * @param bool                 $compared Whether the trend has a comparison.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function build_series(array $cards, bool $compared)
    {
        $points = [];

        foreach ($cards['total_sales']['series'] as $index => $sales_point) {
            $orders_point = $cards['orders']['series'][$index];
            $average_point = $cards['average_order_value']['series'][$index];

            $point = [
                'date' => $sales_point['date'],
                'label' => $sales_point['label'],
                'total_sales' => $this->amount($sales_point['value']),
                'orders' => $orders_point['value'],
                'average_order_value' => $this->amount($average_point['value']),
            ];

            if ($compared) {
                $point['previous_date'] = $sales_point['previous_date'];
                $point['previous_total_sales'] = $this->amount($sales_point['previous_value']);
                $point['previous_orders'] = $orders_point['previous_value'];
                $point['previous_average_order_value'] = $this->amount($average_point['previous_value']);
            }

            $points[] = $point;
        }

        return $points;
    }

    /**
     * Turn a minor amount of the base currency into a decimal amount.
     *
     * @since 1.0.0
     *
     * @param int|null $minor Amount in minor units.
     *
     * @return float|null Null when there is no amount.
     */
    protected function amount($minor)
    {
        return $minor === null ? null : Money::prepare_amount_from_minor((int) $minor);
    }
}
