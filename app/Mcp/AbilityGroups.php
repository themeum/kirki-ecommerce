<?php

namespace Kirki\Ecommerce\App\Mcp;

defined('ABSPATH') || exit;

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
 * The groups that the MCP settings show the store server's tools, resources and prompts in, in display order.
 *
 * @since 1.0.0
 */
final class AbilityGroups
{
    const GROUPS = [
        'sales' => [
            SalesReportTool::class,
            SalesTrendTool::class,
            ProductPerformanceTool::class,
            SalesBreakdownTool::class,
            AnalyticsDefinitionsResource::class,
            MorningBriefPrompt::class,
            WeeklyReviewPrompt::class,
            MonthlyClosePrompt::class,
        ],
        'orders' => [
            FindOrdersTool::class,
            GetOrderTool::class,
            AddOrderNoteTool::class,
            UpdateFulfillmentTool::class,
            MarkOrderPaidTool::class,
            ResendOrderEmailTool::class,
            CancelOrderTool::class,
            CreateManualOrderTool::class,
            OrderLifecycleResource::class,
            InvestigateOrderPrompt::class,
        ],
        'products' => [
            FindProductsTool::class,
            StockLevelsTool::class,
            UpdateProductContentTool::class,
            CreateDraftProductTool::class,
            DuplicateProductTool::class,
            ChangeProductStatusTool::class,
            AdjustStockTool::class,
            UpdatePricesTool::class,
            CatalogStructureResource::class,
            LowStockCheckPrompt::class,
        ],
        'customers' => [
            FindCustomersTool::class,
            UpdateCustomerTagsTool::class,
        ],
        'coupons' => [
            FindCouponsTool::class,
            CreateCouponTool::class,
            SetCouponStateTool::class,
            UpdateCouponTool::class,
        ],
        'store_setup' => [
            SetupStatusTool::class,
            FixStorePagesTool::class,
            UpdateEmailNotificationTool::class,
            StoreProfileResource::class,
            CurrenciesResource::class,
            CheckoutAndPaymentsResource::class,
            TaxAndShippingResource::class,
            SetupGuidePrompt::class,
        ],
    ];
}
