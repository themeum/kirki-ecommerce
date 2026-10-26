<?php

namespace Kirki\Ecommerce\App\Mcp\Servers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Server;
use Kirki\Ecommerce\App\Mcp\Prompts\InvestigateOrderPrompt;
use Kirki\Ecommerce\App\Mcp\Prompts\LowStockCheckPrompt;
use Kirki\Ecommerce\App\Mcp\Prompts\MonthlyClosePrompt;
use Kirki\Ecommerce\App\Mcp\Prompts\MorningBriefPrompt;
use Kirki\Ecommerce\App\Mcp\Prompts\SetupGuidePrompt;
use Kirki\Ecommerce\App\Mcp\Prompts\WeeklyReviewPrompt;
use Kirki\Ecommerce\App\Mcp\Resources\AnalyticsDefinitionsResource;
use Kirki\Ecommerce\App\Mcp\Resources\CatalogStructureResource;
use Kirki\Ecommerce\App\Mcp\Resources\CheckoutAndPaymentsResource;
use Kirki\Ecommerce\App\Mcp\Resources\CurrenciesResource;
use Kirki\Ecommerce\App\Mcp\Resources\OrderLifecycleResource;
use Kirki\Ecommerce\App\Mcp\Resources\StoreProfileResource;
use Kirki\Ecommerce\App\Mcp\Resources\TaxAndShippingResource;
use Kirki\Ecommerce\App\Mcp\Tools\FindCouponsTool;
use Kirki\Ecommerce\App\Mcp\Tools\FindCustomersTool;
use Kirki\Ecommerce\App\Mcp\Tools\FindOrdersTool;
use Kirki\Ecommerce\App\Mcp\Tools\FindProductsTool;
use Kirki\Ecommerce\App\Mcp\Tools\GetOrderTool;
use Kirki\Ecommerce\App\Mcp\Tools\ProductPerformanceTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesBreakdownTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesReportTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesTrendTool;
use Kirki\Ecommerce\App\Mcp\Tools\SetupStatusTool;
use Kirki\Ecommerce\App\Mcp\Tools\StockLevelsTool;

/**
 * The store's MCP server. Each tool, resource and prompt checks the capability that it needs.
 *
 * @since 1.0.0
 */
class StoreServer extends Server
{
    /** @var string */
    protected $name = 'Kirki eCommerce';

    /** @var string */
    protected $description = 'Work with the data of this Kirki eCommerce store. Tools read store data, resources give store-wide context, and prompts give ready-made merchant routines. Each tool tells which store data it reads or changes.';

    /** @var string[] */
    protected $tools = [
        SalesReportTool::class,
        SalesTrendTool::class,
        ProductPerformanceTool::class,
        SalesBreakdownTool::class,
        FindOrdersTool::class,
        GetOrderTool::class,
        FindProductsTool::class,
        StockLevelsTool::class,
        FindCustomersTool::class,
        FindCouponsTool::class,
        SetupStatusTool::class,
    ];

    /** @var string[] */
    protected $resources = [
        StoreProfileResource::class,
        OrderLifecycleResource::class,
        AnalyticsDefinitionsResource::class,
        CheckoutAndPaymentsResource::class,
        TaxAndShippingResource::class,
        CurrenciesResource::class,
        CatalogStructureResource::class,
    ];

    /** @var string[] */
    protected $prompts = [
        MorningBriefPrompt::class,
        WeeklyReviewPrompt::class,
        MonthlyClosePrompt::class,
        LowStockCheckPrompt::class,
        InvestigateOrderPrompt::class,
        SetupGuidePrompt::class,
    ];
}
