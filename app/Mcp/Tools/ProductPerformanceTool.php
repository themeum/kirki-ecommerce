<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\Concerns\ReadsAnalyticsRange;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\App\Services\AnalyticsRangeResolver;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

/**
 * Gives the best-selling products or categories of a date range, with the same numbers as the Analytics page.
 *
 * @since 1.0.0
 */
class ProductPerformanceTool extends StoreReadTool
{
    use ReadsAnalyticsRange;

    const DIMENSIONS = ['product', 'category'];

    /** @var string */
    protected $description = 'Get the best-selling products or categories of the store for a date range, highest net sales first. '
        . 'A product row has the units sold, the net sales (without tax, after discounts) and the stock status. A category row has the net sales. '
        . 'Use "by": "category" for categories. Use "limit" for more or fewer rows (default 5 products or 6 categories, at most 25). '
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
                ->enum(static::DIMENSIONS)
                ->default('product')
                ->description('Rank products or categories.'),
            'limit' => $this->limit_schema($schema, 'Number of rows, from 1 to 25. Default 5 products or 6 categories.'),
        ], $this->range_schema($schema));
    }

    /**
     * Rank the products or categories of the requested range.
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
        [$limit_rules, $limit_messages] = $this->limit_validation();

        $params = $this->validate_range(
            $request->all(),
            array_merge(['by' => 'nullable|string|in:' . implode(',', static::DIMENSIONS)], $limit_rules),
            array_merge(['by.in' => $this->one_of_message('by', static::DIMENSIONS)], $limit_messages)
        );
        $by = $params['by'] ?? 'product';

        $metric = $this->query_service->get_metric($by === 'category' ? 'sales_by_category' : 'sales_by_product', $params);

        return Response::structured(array_merge($this->range_result($metric['meta']), [
            'by' => $by,
            'rows' => $this->plain_rows($metric['data']['items']),
        ]));
    }
}
