<?php

namespace Kirki\Ecommerce\App\Mcp\Servers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Server;
use Kirki\Ecommerce\App\Mcp\Tools\SalesReportTool;

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
    ];
}
