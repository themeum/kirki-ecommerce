<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Tool;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Kirki\Ecommerce\Framework\Wordpress\Constants\Capabilities;

use function Kirki\Ecommerce\App\client_timezone;
use function Kirki\Ecommerce\Framework\throw_exception;

/**
 * Gives the sales of the store for a date range, with the same numbers as the Analytics page.
 *
 * @since 1.0.0
 */
class SalesReportTool extends Tool
{
    const DATE_PATTERN = '^\d{4}-\d{2}-\d{2}$';

    const MONEY_TOTALS = ['gross_sales', 'discounts', 'returns', 'net_sales', 'shipping', 'taxes', 'total_sales'];

    const COUNT_TOTALS = ['orders', 'items_ordered', 'customers', 'new_customers'];

    /** @var string */
    protected $description = 'Get the sales report of the store for a date range: gross, net and total sales, discounts, returns, shipping, taxes, average order value, orders, items, customers, and a sales and orders series over the range. '
        . 'Map the request to "range": "today" → today, "yesterday" → yesterday, "last 7 days" or "this week so far" → last_7, "last 30 days" or "last month" → last_30, "last 90 days" or "last quarter" → last_90, "last 12 months" or "last year" → last_12_months, "this month" → month_to_date, "this year" → year_to_date. '
        . 'For any other period use "custom" with "from" and "to" (Y-m-d, the end not after today). '
        . 'Send "compare" only when the user asks to compare with an earlier period.';

    /** @var bool */
    protected $read_only = true;

    /** @var bool */
    protected $idempotent = true;

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
     * Allow only store administrators to run the tool.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function permission()
    {
        return current_user_can(Capabilities::MANAGE_OPTIONS);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function schema(JsonSchema $schema)
    {
        return [
            'range' => $schema->string()
                ->enum(AnalyticsRangeResolver::PRESETS)
                ->default(AnalyticsRangeResolver::DEFAULT_PRESET)
                ->description('The date range. Use "custom" with "from" and "to" for any other period.'),
            'from' => $schema->string()
                ->pattern(static::DATE_PATTERN)
                ->description('First day of a custom range, Y-m-d. Required when range is "custom".'),
            'to' => $schema->string()
                ->pattern(static::DATE_PATTERN)
                ->description('Last day of a custom range, Y-m-d, not after today. Required when range is "custom".'),
            'compare' => $schema->string()
                ->enum(AnalyticsRangeResolver::COMPARISONS)
                ->description('Optional. The earlier period to compare with. Leave it out unless the user asks for a comparison.'),
            'compare_from' => $schema->string()
                ->pattern(static::DATE_PATTERN)
                ->description('First day of a custom comparison, Y-m-d. Required when compare is "custom".'),
            'compare_to' => $schema->string()
                ->pattern(static::DATE_PATTERN)
                ->description('Last day of a custom comparison, Y-m-d. Required when compare is "custom".'),
        ];
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
        $params = $this->validate($request->all());
        $params['compare'] = $params['compare'] ?? 'none';

        $kpis = $this->query_service->get_metric('kpis', $params);
        $breakdown = $this->query_service->get_metric('total_sales_breakdown', $params);

        return Response::structured($this->build_report($kpis, $breakdown));
    }

    /**
     * Validate the arguments with the rules of the Analytics page, then the order of the dates.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $arguments Tool arguments.
     *
     * @return array<string, mixed> The validated arguments.
     * @throws ValidationException When an argument is not valid.
     */
    protected function validate(array $arguments)
    {
        $params = Validator::make($arguments, [
            'range' => 'nullable|string|in:' . implode(',', AnalyticsRangeResolver::PRESETS),
            'from' => 'required_if:range,custom|nullable|date|format:Y-m-d',
            'to' => 'required_if:range,custom|nullable|date|format:Y-m-d',
            'compare' => 'nullable|string|in:' . implode(',', AnalyticsRangeResolver::COMPARISONS),
            'compare_from' => 'required_if:compare,custom|nullable|date|format:Y-m-d',
            'compare_to' => 'required_if:compare,custom|nullable|date|format:Y-m-d',
        ], $this->messages())->validate();

        $errors = [];

        if (($params['range'] ?? null) === 'custom') {
            if ($params['to'] > $this->range_resolver->today()) {
                $errors['to'] = [__('The end date "to" cannot be after today.', 'kirki-ecommerce')];
            } elseif ($params['from'] > $params['to']) {
                $errors['from'] = [__('The start date "from" cannot be after the end date "to".', 'kirki-ecommerce')];
            }
        }

        if (($params['compare'] ?? null) === 'custom' && $params['compare_from'] > $params['compare_to']) {
            $errors['compare_from'] = [__('The comparison start date "compare_from" cannot be after "compare_to".', 'kirki-ecommerce')];
        }

        if (!empty($errors)) {
            throw_exception(ValidationException::with_errors($errors));
        }

        return $params;
    }

    /**
     * Get the validation messages. Each one names its argument, so the client knows what to fix.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function messages()
    {
        $field_messages = [
            'from' => __('Enter a start date "from" as Y-m-d.', 'kirki-ecommerce'),
            'to' => __('Enter an end date "to" as Y-m-d.', 'kirki-ecommerce'),
            'compare_from' => __('Enter a comparison start date "compare_from" as Y-m-d.', 'kirki-ecommerce'),
            'compare_to' => __('Enter a comparison end date "compare_to" as Y-m-d.', 'kirki-ecommerce'),
        ];

        $messages = [
            'range.in' => __('The range must be one of: ', 'kirki-ecommerce') . implode(', ', AnalyticsRangeResolver::PRESETS) . '.',
            'compare.in' => __('The compare must be one of: ', 'kirki-ecommerce') . implode(', ', AnalyticsRangeResolver::COMPARISONS) . '.',
        ];

        foreach ($field_messages as $field => $message) {
            $messages[$field . '.required_if'] = $message;
            $messages[$field . '.date'] = $message;
            $messages[$field . '.format'] = $message;
        }

        return $messages;
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
     * Turn a money metric of the Analytics page into a report total.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $metric Money metric with current_money_object, previous_money_object and change.
     *
     * @return array<string, mixed>
     */
    protected function money_total(array $metric)
    {
        return [
            'current' => $this->money_value($metric['current_money_object']),
            'previous' => $this->money_value($metric['previous_money_object']),
            'change' => $metric['change'],
        ];
    }

    /**
     * Turn a money object into a decimal amount, a display string and a currency code.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\DTO\MoneyDTO|null $money Money object, or null when there is no value.
     *
     * @return array<string, mixed>|null
     */
    protected function money_value($money)
    {
        if ($money === null) {
            return null;
        }

        return [
            'amount' => $money->raw,
            'display' => $money->display,
            'currency' => $money->currency->code,
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
