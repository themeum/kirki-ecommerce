<?php

namespace Kirki\Ecommerce\App\Mcp\Prompts;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\Tools\ProductPerformanceTool;
use Kirki\Ecommerce\App\Mcp\Tools\StockLevelsTool;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;

/**
 * A reorder list of the variants that are out of stock or low on stock, best sellers first.
 *
 * @since 1.0.0
 */
class LowStockCheckPrompt extends StorePrompt
{
    /** @var string */
    protected $title = 'Low stock check';

    /** @var string */
    protected $description = 'A reorder list of the variants that are out of stock or low on stock, with out-of-stock items first and best sellers first in each group. Read-only.';

    /**
     * Build the prompt message.
     *
     * @since 1.0.0
     *
     * @param Request $request The prompt fetch.
     *
     * @return Response[]
     */
    public function handle(Request $request)
    {
        $calls = [
            $this->tool_call(StockLevelsTool::class, ['status' => 'attention', 'per_page' => 100]),
            $this->tool_call(ProductPerformanceTool::class, ['range' => 'last_30', 'by' => 'product', 'limit' => AnalyticsQueryService::MAX_LIMIT]),
        ];

        return [
            Response::text($this->message([
                __('Give me a reorder list of the stock that needs attention.', 'kirki-ecommerce'),
                $this->read_only_rule(),
                __('Call these store tools:', 'kirki-ecommerce') . "\n" . implode("\n", $calls),
                __('Read the next pages of the stock levels (page 2, 3 and so on) until the last page.', 'kirki-ecommerce'),
                __('Answer with a reorder list: out-of-stock variants first, then low-stock variants. In each group, put the best sellers of the last 30 days first. Give the SKU, the quantity left and the threshold of each variant.', 'kirki-ecommerce'),
            ])),
        ];
    }
}
