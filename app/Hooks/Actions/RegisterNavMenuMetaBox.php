<?php

/**
 * Register the Kirki Ecommerce meta box on the Appearance > Menus screen
 *
 * @package Kirki\Ecommerce\App\Hooks\Actions
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Actions;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Supports\NavMenuItems;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\include_view;

/**
 * Adds a meta box to the menu editor for adding the currency switcher and mini cart to a menu.
 *
 * @since 1.0.0
 */
class RegisterNavMenuMetaBox extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return WPHookNames::ADMIN_INIT;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    /**
     * Add the meta box to the `nav-menus` screen.
     *
     * Runs on the `admin_init` action.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments, unused.
     * @return void
     */
    public function handle(...$args)
    {
        add_meta_box(
            'kecom-nav-menu-items',
            __('Kirki Ecommerce', 'kirki-ecommerce'),
            [$this, 'render'],
            'nav-menus',
            'side',
            'default'
        );
    }

    /**
     * Render the meta box content.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function render()
    {
        include_view('admin.nav-menu-metabox', ['items' => NavMenuItems::get_items()]);
    }
}
