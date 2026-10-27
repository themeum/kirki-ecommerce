<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Facades\Mcp;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Registrar\AbilityRegistrar;
use Kirki\Ecommerce\App\Mcp\Resources\StoreProfileResource;
use Kirki\Ecommerce\App\Mcp\Servers\StoreServer;
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
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 1.4: registration and access of the store's MCP server.
 *
 * Spec: mcp-server (Server id and transports, Server needs the MCP Adapter, Each tool checks its own access,
 * Server offers resources and prompts).
 */
class McpServerTest extends RestTestCase
{
    /**
     * Scenario "HTTP client lists the tools": the server is registered as kirki-ecommerce and lists the 11 read tools, then the write tools.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_server_is_registered_with_its_tools(): void
    {
        $servers = Mcp::servers();
        $tools = (new StoreServer())->tools();

        $this->assertSame(StoreServer::class, $servers['kirki-ecommerce'] ?? null);
        $this->assertCount(11 + count(static::write_tools()), $tools);
        $this->assertSame(SalesReportTool::class, $tools[0]);
        $this->assertSame(array_column(static::read_only_tools(), 0), array_slice($tools, 1, 10));
        $this->assertSame(array_column(static::write_tools(), 0), array_slice($tools, 11));
        $this->assertCount(29, $tools);
        $this->assertStringContainsString('Tools read or change store data', (new StoreServer())->description());
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
     * Get the write tools with their ability names.
     *
     * @return array<string, array{0: string, 1: string}>
     * @since 1.0.0
     */
    public static function write_tools(): array
    {
        return [
            'add-order-note' => [AddOrderNoteTool::class, 'kirki-ecommerce/add-order-note'],
            'update-fulfillment' => [UpdateFulfillmentTool::class, 'kirki-ecommerce/update-fulfillment'],
            'mark-order-paid' => [MarkOrderPaidTool::class, 'kirki-ecommerce/mark-order-paid'],
            'resend-order-email' => [ResendOrderEmailTool::class, 'kirki-ecommerce/resend-order-email'],
            'cancel-order' => [CancelOrderTool::class, 'kirki-ecommerce/cancel-order'],
            'create-manual-order' => [CreateManualOrderTool::class, 'kirki-ecommerce/create-manual-order'],
            'update-product-content' => [UpdateProductContentTool::class, 'kirki-ecommerce/update-product-content'],
            'create-draft-product' => [CreateDraftProductTool::class, 'kirki-ecommerce/create-draft-product'],
            'duplicate-product' => [DuplicateProductTool::class, 'kirki-ecommerce/duplicate-product'],
            'change-product-status' => [ChangeProductStatusTool::class, 'kirki-ecommerce/change-product-status'],
            'adjust-stock' => [AdjustStockTool::class, 'kirki-ecommerce/adjust-stock'],
            'update-prices' => [UpdatePricesTool::class, 'kirki-ecommerce/update-prices'],
            'update-customer-tags' => [UpdateCustomerTagsTool::class, 'kirki-ecommerce/update-customer-tags'],
            'create-coupon' => [CreateCouponTool::class, 'kirki-ecommerce/create-coupon'],
            'set-coupon-state' => [SetCouponStateTool::class, 'kirki-ecommerce/set-coupon-state'],
            'update-coupon' => [UpdateCouponTool::class, 'kirki-ecommerce/update-coupon'],
            'fix-store-pages' => [FixStorePagesTool::class, 'kirki-ecommerce/fix-store-pages'],
            'update-email-notification' => [UpdateEmailNotificationTool::class, 'kirki-ecommerce/update-email-notification'],
        ];
    }

    /**
     * Scenarios "Not offered to other servers" and "Editor cannot change an order": each write tool is not read-only,
     * only the store server offers it, and only an administrator can run it.
     *
     * @dataProvider write_tools
     *
     * @param string $tool Tool class.
     * @param string $name Ability name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_write_tool_annotations_and_access(string $tool, string $name): void
    {
        $instance = app()->make($tool);

        $this->assertSame($name, $instance->name());
        $this->assertFalse($instance->read_only());
        $this->assertFalse($instance->is_public());
        $this->assertFalse($instance->shows_in_rest());

        wp_set_current_user(static::factory()->user->create(['role' => 'administrator']));
        $this->assertTrue($instance->permission());

        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));
        $this->assertFalse($instance->permission());
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

    /**
     * Scenario "Client lists the resources": 7 resources, each with its kecom:// URI and the JSON MIME type.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_server_offers_the_resources(): void
    {
        $registrar = app()->make(AbilityRegistrar::class);
        $resources = (new StoreServer())->resources();
        $listed = [];

        foreach ($resources as $resource) {
            $mcp = $registrar->arguments(app()->make($resource))['meta']['mcp'];
            $listed[$mcp['uri']] = $mcp['mimeType'];

            $this->assertSame('resource', $mcp['type']);
        }

        $this->assertSame([
            'kecom://store/profile' => 'application/json',
            'kecom://store/order-lifecycle' => 'application/json',
            'kecom://store/analytics-definitions' => 'application/json',
            'kecom://store/checkout-and-payments' => 'application/json',
            'kecom://store/tax-and-shipping' => 'application/json',
            'kecom://store/currencies' => 'application/json',
            'kecom://catalog/structure' => 'application/json',
        ], $listed);
    }

    /**
     * Scenario "Client lists the prompts": 6 prompts, each with its arguments as string properties.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_server_offers_the_prompts(): void
    {
        $registrar = app()->make(AbilityRegistrar::class);
        $listed = [];

        foreach ((new StoreServer())->prompts() as $prompt) {
            $instance = app()->make($prompt);
            $arguments = $registrar->arguments($instance);

            $this->assertSame('prompt', $arguments['meta']['mcp']['type']);
            $listed[AbilityRegistrar::mcp_name($instance->name())] = array_keys((array) ($arguments['input_schema']['properties'] ?? []));
        }

        $this->assertSame([
            'kirki-ecommerce-morning-brief' => ['date'],
            'kirki-ecommerce-weekly-review' => ['range', 'compare'],
            'kirki-ecommerce-monthly-close' => ['month'],
            'kirki-ecommerce-low-stock-check' => [],
            'kirki-ecommerce-investigate-order' => ['order_number'],
            'kirki-ecommerce-setup-guide' => [],
        ], $listed);
    }

    /**
     * Scenario "Editor cannot read a resource": the registered permission callback rejects an editor.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_editor_cannot_read_a_resource(): void
    {
        $permission = app()->make(AbilityRegistrar::class)->arguments(app()->make(StoreProfileResource::class))['permission_callback'];

        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));
        $this->assertFalse($permission());

        wp_set_current_user(static::factory()->user->create(['role' => 'administrator']));
        $this->assertTrue($permission());
    }
}
