<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Mcp\McpAbilities;
use Kirki\Ecommerce\App\Mcp\Prompts\InvestigateOrderPrompt;
use Kirki\Ecommerce\App\Mcp\Resources\OrderLifecycleResource;
use Kirki\Ecommerce\App\Mcp\Tools\CancelOrderTool;
use Kirki\Ecommerce\App\Mcp\Tools\CreateCouponTool;
use Kirki\Ecommerce\App\Mcp\Tools\FindCouponsTool;
use Kirki\Ecommerce\App\Mcp\Tools\FindOrdersTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdatePricesTool;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 1.3: which MCP abilities are on.
 *
 * Spec: mcp-settings (MCP settings are stored as one settings section, Settings response describes the server,
 * Which abilities the server offers).
 */
class McpAbilitiesTest extends RestTestCase
{
    /**
     * Reset the MCP settings to their defaults.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        static::set_mcp([]);
    }

    /**
     * Store MCP settings over the defaults.
     *
     * @param array<string, mixed> $values Settings values.
     *
     * @return void
     * @since 1.0.0
     */
    protected static function set_mcp(array $values): void
    {
        Settings::get(OptionKeys::MCP_SETTINGS)->set(array_merge([
            'enabled' => false,
            'read_only' => false,
            'groups' => [],
            'abilities' => [],
        ], $values), false);
    }

    /**
     * Get the abilities service.
     *
     * @return McpAbilities
     * @since 1.0.0
     */
    protected function abilities(): McpAbilities
    {
        return app()->make(McpAbilities::class);
    }

    /**
     * Scenario "Fresh install": MCP is off, read-only is off and every ability counts as on.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_fresh_install_defaults(): void
    {
        $this->assertFalse($this->abilities()->is_enabled());
        $this->assertFalse($this->abilities()->is_read_only());
        $this->assertSame(42, $this->abilities()->count_on());
    }

    /**
     * Scenario "New ability after an update": a name missing from the stored map counts as on.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_missing_ability_counts_as_on(): void
    {
        static::set_mcp(['abilities' => ['kirki-ecommerce/cancel-order' => false]]);

        $this->assertTrue($this->abilities()->is_on(FindOrdersTool::class));
        $this->assertFalse($this->abilities()->is_on(CancelOrderTool::class));
        $this->assertSame(41, $this->abilities()->count_on());
    }

    /**
     * Scenario "Group off": every ability of the group is off, of all 3 kinds.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_group_off_turns_its_abilities_off(): void
    {
        static::set_mcp(['groups' => ['orders' => false], 'abilities' => ['kirki-ecommerce/find-orders' => true]]);

        $this->assertFalse($this->abilities()->is_on(FindOrdersTool::class));
        $this->assertFalse($this->abilities()->is_on(OrderLifecycleResource::class));
        $this->assertFalse($this->abilities()->is_on(InvestigateOrderPrompt::class));
        $this->assertSame([FindCouponsTool::class], $this->abilities()->filter([FindOrdersTool::class, FindCouponsTool::class]));
    }

    /**
     * Scenario "Read-only mode": write tools are off, read tools, resources and prompts stay on.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_read_only_turns_only_write_tools_off(): void
    {
        static::set_mcp(['read_only' => true]);

        $this->assertFalse($this->abilities()->is_on(UpdatePricesTool::class));
        $this->assertFalse($this->abilities()->is_on(CreateCouponTool::class));
        $this->assertTrue($this->abilities()->is_on(FindCouponsTool::class));
        $this->assertTrue($this->abilities()->is_on(OrderLifecycleResource::class));
        $this->assertTrue($this->abilities()->is_on(InvestigateOrderPrompt::class));
        $this->assertSame(24, $this->abilities()->count_on());
    }

    /**
     * Scenario "Stored values come back": turning a group or read-only mode off and on keeps each ability's own value.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_stored_values_come_back(): void
    {
        $abilities = ['kirki-ecommerce/create-coupon' => false];

        static::set_mcp(['groups' => ['coupons' => false], 'read_only' => true, 'abilities' => $abilities]);
        static::set_mcp(['groups' => ['coupons' => true], 'read_only' => false, 'abilities' => $abilities]);

        $this->assertTrue($this->abilities()->is_on(FindCouponsTool::class));
        $this->assertFalse($this->abilities()->is_on(CreateCouponTool::class));
    }

    /**
     * Scenarios "Catalog covers the server" and "Write tools are marked".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_catalog_lists_every_ability_with_its_kind(): void
    {
        $catalog = $this->abilities()->catalog();
        $entries = array_merge(...array_column($catalog, 'abilities'));
        $by_name = array_column($entries, null, 'name');
        $kinds = array_count_values(array_column($entries, 'kind'));

        $this->assertSame(['sales', 'orders', 'products', 'customers', 'coupons', 'store_setup'], array_column($catalog, 'id'));
        $this->assertSame('Orders', $catalog[1]['label']);
        $this->assertNotSame('', $catalog[1]['description']);
        $this->assertSame(['tool' => 29, 'resource' => 7, 'prompt' => 6], [
            'tool' => $kinds['tool'],
            'resource' => $kinds['resource'],
            'prompt' => $kinds['prompt'],
        ]);
        $this->assertSame(18, count(array_filter(array_column($entries, 'is_write'))));
        $this->assertTrue($by_name['kirki-ecommerce/cancel-order']['is_write']);
        $this->assertSame('tool', $by_name['kirki-ecommerce/cancel-order']['kind']);
        $this->assertFalse($by_name['kirki-ecommerce/find-orders']['is_write']);
        $this->assertNotSame('', $by_name['kirki-ecommerce/find-orders']['title']);
        $this->assertCount(42, $this->abilities()->ability_names());
    }
}
