<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Facades\Mcp;
use Kirki\Ecommerce\App\Mcp\Servers\StoreServer;
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
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 1.4: registration and access of the store's MCP server.
 *
 * Spec: mcp-server (Server id and transports, Server needs the MCP Adapter, Each tool checks its own access).
 */
class McpServerTest extends RestTestCase
{
    /**
     * Scenario "HTTP client lists the tools": the server is registered as kirki-ecommerce and lists the 11 tools.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_server_is_registered_with_its_tools(): void
    {
        $servers = Mcp::servers();
        $tools = (new StoreServer())->tools();

        $this->assertSame(StoreServer::class, $servers['kirki-ecommerce'] ?? null);
        $this->assertCount(11, $tools);
        $this->assertSame(SalesReportTool::class, $tools[0]);
        $this->assertSame(array_column(static::read_only_tools(), 0), array_slice($tools, 1));
    }

    /**
     * Get the 10 read-only store tools with their ability names.
     *
     * @return array<string, array{0: string, 1: string}>
     * @since 1.0.0
     */
    public static function read_only_tools(): array
    {
        return [
            'sales-trend' => [SalesTrendTool::class, 'kirki-ecommerce/sales-trend'],
            'product-performance' => [ProductPerformanceTool::class, 'kirki-ecommerce/product-performance'],
            'sales-breakdown' => [SalesBreakdownTool::class, 'kirki-ecommerce/sales-breakdown'],
            'find-orders' => [FindOrdersTool::class, 'kirki-ecommerce/find-orders'],
            'get-order' => [GetOrderTool::class, 'kirki-ecommerce/get-order'],
            'find-products' => [FindProductsTool::class, 'kirki-ecommerce/find-products'],
            'stock-levels' => [StockLevelsTool::class, 'kirki-ecommerce/stock-levels'],
            'find-customers' => [FindCustomersTool::class, 'kirki-ecommerce/find-customers'],
            'find-coupons' => [FindCouponsTool::class, 'kirki-ecommerce/find-coupons'],
            'setup-status' => [SetupStatusTool::class, 'kirki-ecommerce/setup-status'],
        ];
    }

    /**
     * Scenario "Annotations", "Not offered to other servers" and the access scenarios: each read-only tool is
     * read-only, idempotent, not destructive and not open-world, only the store server offers it, and only an administrator can run it.
     *
     * @dataProvider read_only_tools
     *
     * @param string $tool Tool class.
     * @param string $name Ability name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_read_only_tool_annotations_and_access(string $tool, string $name): void
    {
        $instance = app()->make($tool);

        $this->assertSame($name, $instance->name());
        $this->assertSame(['readonly' => true, 'destructive' => false, 'idempotent' => true, 'openWorldHint' => false], $instance->hints());
        $this->assertFalse($instance->is_public());
        $this->assertFalse($instance->shows_in_rest());

        wp_set_current_user(static::factory()->user->create(['role' => 'administrator']));
        $this->assertTrue($instance->permission());

        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));
        $this->assertFalse($instance->permission());

        wp_set_current_user(0);
        $this->assertFalse($instance->permission());
    }

    /**
     * The HTTP endpoint is mcp/kirki-ecommerce under the plugin REST namespace, and HTTP is a transport.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_server_route_and_transports(): void
    {
        $server = (new StoreServer())->set_id('kirki-ecommerce');

        $this->assertSame('mcp/kirki-ecommerce', $server->route());
        $this->assertSame(['WP\MCP\Transport\HttpTransport'], $server->transports());
    }

    /**
     * The server has no permission() of its own, so the adapter's default gate applies and each tool checks its own capability.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_server_has_no_own_permission_gate(): void
    {
        $this->assertFalse(method_exists(StoreServer::class, 'permission'));
    }

    /**
     * Scenario "Adapter plugin is not active": the plugin loads, no server is created and no MCP route exists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_no_mcp_route_without_the_adapter(): void
    {
        $this->assertFalse(class_exists('WP\MCP\Core\McpAdapter'));
        $this->assertNull(Mcp::get('kirki-ecommerce'));

        $routes = array_keys(rest_get_server()->get_routes());
        $mcp_routes = array_filter($routes, fn($route) => strpos($route, '/mcp/kirki-ecommerce') !== false);

        $this->assertSame([], array_values($mcp_routes));
    }
}
