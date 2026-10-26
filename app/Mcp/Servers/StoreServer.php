<?php

namespace Kirki\Ecommerce\App\Mcp\Servers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Server;
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
 * The store's MCP server. Each tool checks the capability that it needs.
 *
 * @since 1.0.0
 */
class StoreServer extends Server
{
    /** @var string */
    protected $name = 'Kirki eCommerce';

    /** @var string */
    protected $description = 'Work with the data of this Kirki eCommerce store. Each tool tells which store data it reads or changes.';

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
}
