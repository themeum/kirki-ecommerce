<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;

/**
 * Removes the auto-generated duplicate first submenu entry under the plugin's top-level admin menu.
 *
 * @since 1.0.0
 */
class RemoveDuplicateSubmenu extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::ADMIN_MENU;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return HookTypes::ACTION;
    }

    /**
     * Remove the submenu page that repeats the top-level plugin menu entry.
     *
     * Runs on the `admin_menu` action.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments, unused.
     * @return void
     */
    public function handle(...$args)
    {
        remove_submenu_page('kirki-ecommerce', 'kirki-ecommerce');
    }
}
