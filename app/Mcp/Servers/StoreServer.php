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
use Kirki\Ecommerce\App\Mcp\Tools\AddOrderNoteTool;
use Kirki\Ecommerce\App\Mcp\Tools\AdjustStockTool;
use Kirki\Ecommerce\App\Mcp\Tools\CancelOrderTool;
use Kirki\Ecommerce\App\Mcp\Tools\ChangeProductStatusTool;
use Kirki\Ecommerce\App\Mcp\Tools\CreateCouponTool;
use Kirki\Ecommerce\App\Mcp\Tools\CreateDraftProductTool;
use Kirki\Ecommerce\App\Mcp\Tools\CreateManualOrderTool;
use Kirki\Ecommerce\App\Mcp\Tools\DuplicateProductTool;
use Kirki\Ecommerce\App\Mcp\Tools\FindCouponsTool;
use Kirki\Ecommerce\App\Mcp\Tools\FindCustomersTool;
use Kirki\Ecommerce\App\Mcp\Tools\FindOrdersTool;
use Kirki\Ecommerce\App\Mcp\Tools\FindProductsTool;
use Kirki\Ecommerce\App\Mcp\Tools\FixStorePagesTool;
use Kirki\Ecommerce\App\Mcp\Tools\GetOrderTool;
use Kirki\Ecommerce\App\Mcp\Tools\MarkOrderPaidTool;
use Kirki\Ecommerce\App\Mcp\Tools\ProductPerformanceTool;
use Kirki\Ecommerce\App\Mcp\Tools\ResendOrderEmailTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesBreakdownTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesReportTool;
use Kirki\Ecommerce\App\Mcp\Tools\SalesTrendTool;
use Kirki\Ecommerce\App\Mcp\Tools\SetCouponStateTool;
use Kirki\Ecommerce\App\Mcp\Tools\SetupStatusTool;
use Kirki\Ecommerce\App\Mcp\Tools\StockLevelsTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdateCouponTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdateCustomerTagsTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdateEmailNotificationTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdateFulfillmentTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdatePricesTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdateProductContentTool;

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
    protected $description = 'Work with the data of this Kirki eCommerce store. Tools read or change store data, resources give store-wide context, and prompts give ready-made merchant routines. Each tool tells which store data it reads or changes.';

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
        AddOrderNoteTool::class,
        UpdateFulfillmentTool::class,
        MarkOrderPaidTool::class,
        ResendOrderEmailTool::class,
        CancelOrderTool::class,
        CreateManualOrderTool::class,
        UpdateProductContentTool::class,
        CreateDraftProductTool::class,
        DuplicateProductTool::class,
        ChangeProductStatusTool::class,
        AdjustStockTool::class,
        UpdatePricesTool::class,
        UpdateCustomerTagsTool::class,
        CreateCouponTool::class,
        SetCouponStateTool::class,
        UpdateCouponTool::class,
        FixStorePagesTool::class,
        UpdateEmailNotificationTool::class,
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
