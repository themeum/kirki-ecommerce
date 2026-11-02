<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Menu\Analytics;
use Kirki\Ecommerce\App\Menu\Orders;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use ReflectionClass;

/**
 * Covers the menu part of the analytics-page scenario "Open Analytics".
 */
class AnalyticsMenuTest extends RestTestCase
{
    /**
     * Scenario "Open Analytics": the submenu opens #/analytics under the eCommerce menu for users with manage_options.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_analytics_submenu_opens_the_analytics_route_for_manage_options(): void
    {
        $defaults = (new ReflectionClass(Analytics::class))->getDefaultProperties();

        $this->assertSame('kirki-ecommerce#/analytics', $defaults['menu_slug']);
        $this->assertSame('kirki-ecommerce', $defaults['parent_slug']);
        $this->assertSame('manage_options', $defaults['capabilities']);
    }

    /**
     * Scenario "Open Analytics": the Analytics submenu comes right after Orders.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_analytics_submenu_is_registered_right_after_orders(): void
    {
        $menus = require dirname(__DIR__, 2) . '/config/menu.php';
        $position = array_search(Orders::class, $menus, true);

        $this->assertNotFalse($position);
        $this->assertSame(Analytics::class, $menus[$position + 1] ?? null);
    }
}
