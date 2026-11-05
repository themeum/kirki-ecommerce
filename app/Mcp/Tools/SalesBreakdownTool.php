<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\Concerns\ReadsAnalyticsRange;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

/**
 * Gives the sales of a date range split by one dimension, with the same numbers as the Analytics page cards.
 *
 * @since 1.0.0
 */
class SalesBreakdownTool extends StoreReadTool
{
    use ReadsAnalyticsRange;

    const METRICS = [
        'coupon' => 'sales_by_coupon_code',
        'payment_method' => 'sales_by_payment_method',
        'shipping_method' => 'shipping_charges_by_method',
        'country' => 'sales_by_location',
        'region' => 'sales_by_location',
        'tax_region' => 'taxes_by_region',
    ];

    const RANKED = ['coupon', 'payment_method', 'shipping_method', 'tax_region'];

    /** @var string */
    protected $description = 'Get the sales of the store for a date range, split by one dimension in "by": '
        . '"coupon" (orders and discount given for each code), "payment_method" (orders and total sales), "shipping_method" (orders and shipping charges), '
        . '"country" (sales, orders and customers of every country), "region" (the top 5 regions of one country by sales, by orders and by customers; needs "country" as a 2-letter code), '
        . '"tax_region" (product, shipping and total tax). '
        . '"limit" (1 to 25, default 5) applies only to coupon, payment_method, shipping_method and tax_region. '
        . 'The range arguments are the same as in the sales report tool.';

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
        return array_merge([
            'by' => $schema->string()
                ->enum(array_keys(static::METRICS))
                ->required()
                ->description('The dimension to split the sales by.'),
            'country' => $schema->string()
                ->pattern('^[A-Za-z]{2}$')
                ->description('ISO 3166-1 alpha-2 country code, for example "US". Required when "by" is "region".'),
            'limit' => $this->limit_schema($schema, 'Number of rows for coupon, payment_method, shipping_method and tax_region, from 1 to 25. Default 5.'),
        ], $this->range_schema($schema));
    }

    /**
     * Split the sales of the requested range by the requested dimension.
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
        $params = $this->validate_breakdown($request->all());
        $by = $params['by'];

        $metric = $this->query_service->get_metric(static::METRICS[$by], $params);
        $result = array_merge($this->range_result($metric['meta']), ['by' => $by]);

        if ($by === 'region') {
            $regions = $this->query_service->get_regions($params);

            return Response::structured(array_merge($result, [
                'country' => $regions['country'],
                'top_by_sales' => $this->plain_rows($regions['sales']),
                'top_by_orders' => $this->plain_rows($regions['orders']),
                'top_by_customers' => $this->plain_rows($regions['customers']),
            ]));
        }

        $rows = $by === 'country' ? $metric['data']['countries'] : $metric['data']['items'];

        return Response::structured(array_merge($result, ['rows' => $this->plain_rows($rows)]));
    }

    /**
     * Validate the range, the dimension, the country and the limit.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $arguments Tool arguments.
     *
     * @return array<string, mixed> The validated arguments.
     * @throws ValidationException When an argument is not valid.
     */
    protected function validate_breakdown(array $arguments)
    {
        [$limit_rules, $limit_messages] = $this->limit_validation();
        $dimensions = array_keys(static::METRICS);
        $by_message = $this->one_of_message('by', $dimensions);
        $country_message = __('Enter "country" as an ISO 3166-1 alpha-2 code, for example "US". It is required when "by" is "region".', 'kirki-ecommerce');

        $params = $this->validate_range(
            $arguments,
            array_merge([
                'by' => 'required|string|in:' . implode(',', $dimensions),
                'country' => 'required_if:by,region|nullable|string',
            ], $limit_rules),
            array_merge([
                'by.required' => $by_message,
                'by.in' => $by_message,
                'country.required_if' => $country_message,
                'country.string' => $country_message,
            ], $limit_messages)
        );

        if (!empty($params['country']) && CountryData::find_index_entry((string) $params['country']) === null) {
            $this->reject(['country' => [$country_message]]);
        }

        if (isset($params['limit']) && !in_array($params['by'], static::RANKED, true)) {
            /* translators: %s: comma separated dimensions. */
            $this->reject(['limit' => [sprintf(__('The "limit" applies only when "by" is one of: %s.', 'kirki-ecommerce'), implode(', ', static::RANKED))]]);
        }

        return $params;
    }
}
