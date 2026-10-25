<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Facades\Mcp;
use Kirki\Ecommerce\App\Mcp\Servers\StoreServer;
use Kirki\Ecommerce\App\Mcp\Tools\SalesReportTool;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers task 1.4: registration and access of the store's MCP server.
 *
 * Spec: mcp-server (Server id and transports, Server needs the MCP Adapter, Each tool checks its own access).
 */
class McpServerTest extends RestTestCase
{
    /**
     * Scenario "HTTP client lists the tools": the server is registered as kirki-ecommerce and lists the sales report tool.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_server_is_registered_with_the_sales_report_tool(): void
    {
        $servers = Mcp::servers();

        $this->assertSame(StoreServer::class, $servers['kirki-ecommerce'] ?? null);
        $this->assertSame([SalesReportTool::class], (new StoreServer())->tools());
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
