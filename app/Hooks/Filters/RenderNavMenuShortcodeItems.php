<?php

/**
 * Render shortcode menu items in navigation menus
 *
 * @package Kirki\Ecommerce\App\Hooks\Filters
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Filters;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Supports\NavMenuItems;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Replaces the output of the currency switcher and mini cart menu items with their shortcodes.
 *
 * @since 1.0.0
 */
class RenderNavMenuShortcodeItems extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return WPHookNames::WALKER_NAV_MENU_START_EL;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_args_count()
    {
        return 4;
    }

    /**
     * Swap the menu item markup for the shortcode output when the item links to one.
     *
     * Responds to walker_nav_menu_start_el.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments: item output, menu item, depth and menu arguments.
     * @return string The shortcode output, or the incoming item output for any other menu item.
     */
    public function handle(...$args)
    {
        $item_output = $args[0];
        $shortcode   = NavMenuItems::get_shortcode_for_url((string) ($args[1]->url ?? ''));

        if ($shortcode === '') {
            return $item_output;
        }

        return do_shortcode($shortcode);
    }
}
