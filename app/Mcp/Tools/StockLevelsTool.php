<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Mcp\Concerns\PagesResults;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

/**
 * Lists the variants that are out of stock or low on stock, with the rules of the Inventory health card.
 *
 * @since 1.0.0
 */
class StockLevelsTool extends StoreReadTool
{
    use PagesResults;

    const STATUSES = [
        'out_of_stock' => [AvailabilityStatus::OUT_OF_STOCK],
        'low_stock' => [AvailabilityStatus::LOW_STOCK],
        'attention' => [AvailabilityStatus::OUT_OF_STOCK, AvailabilityStatus::LOW_STOCK],
    ];

    /** @var string */
    protected $description = 'List the product variants that are out of stock or low on stock, lowest available quantity first, and the counts of out-of-stock, low-stock and in-stock variants. '
        . 'Use it for questions such as "what must I reorder?". "status": "attention" (default) lists both. '
        . 'A variant threshold overrides the store default threshold. The list has only variants that track inventory; the counts have all variants.';

    /** @var AnalyticsQueryService */
    protected $query_service;

    /**
     * Create the tool with the analytics service.
     *
     * @since 1.0.0
     *
     * @param AnalyticsQueryService $query_service Service of the Inventory health card.
     */
    public function __construct(AnalyticsQueryService $query_service)
    {
        $this->query_service = $query_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function input_schema(JsonSchema $schema)
    {
        return array_merge([
            'status' => $schema->string()
                ->enum(array_keys(static::STATUSES))
                ->default('attention')
                ->description('The variants to list: out_of_stock, low_stock, or attention for both.'),
        ], $this->page_schema($schema));
    }

    /**
     * List the variants with the requested stock status.
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
        $statuses = array_keys(static::STATUSES);

        $params = $this->validate_arguments(
            $request->all(),
            array_merge(['status' => 'nullable|string|in:' . implode(',', $statuses)], $this->page_rules()),
            array_merge(['status.in' => $this->one_of_message('status', $statuses)], $this->page_messages())
        );
        [$page, $per_page] = $this->page_arguments($params);
        $status = $params['status'] ?? 'attention';

        $levels = $this->query_service->stock_levels(static::STATUSES[$status], $per_page, $page);

        return Response::structured([
            'status' => $status,
            'counts' => $levels['counts'],
            'variants' => $levels['variants'],
            'pagination' => $this->pagination_of($page, $per_page, $levels['total']),
        ]);
    }
}
