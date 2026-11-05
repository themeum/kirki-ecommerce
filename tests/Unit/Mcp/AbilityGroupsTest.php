<?php

namespace Kirki\Ecommerce\Tests\Unit\Mcp;

use Kirki\Ecommerce\App\Mcp\AbilityGroups;
use Kirki\Ecommerce\App\Mcp\Servers\StoreServer;
use Kirki\Ecommerce\Tests\Unit\TestCase;

/**
 * Covers task 1.2: the group map of the MCP settings.
 *
 * Spec: mcp-settings (Settings response describes the server).
 */
class AbilityGroupsTest extends TestCase
{
    public function test_groups_are_in_display_order(): void
    {
        $this->assertSame(['sales', 'orders', 'products', 'customers', 'coupons', 'store_setup'], array_keys(AbilityGroups::GROUPS));
    }

    public function test_every_server_component_is_in_exactly_one_group(): void
    {
        $grouped = array_merge(...array_values(AbilityGroups::GROUPS));
        $components = array_merge(...array_values((new StoreServer())->all_components()));

        $this->assertSame(array_unique($grouped), $grouped);
        $this->assertCount(42, $grouped);

        sort($grouped);
        sort($components);

        $this->assertSame($components, $grouped);
    }
}
