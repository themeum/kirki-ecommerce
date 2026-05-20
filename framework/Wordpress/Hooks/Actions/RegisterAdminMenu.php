<?php

namespace Kirki\Ecommerce\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Wordpress\BaseHook;
use Kirki\Ecommerce\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Wordpress\Menu;
use Exception;

use function Kirki\Ecommerce\config;

class RegisterAdminMenu extends BaseHook
{
    public function get_name()
    {
        return HookNames::ADMIN_MENU;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        $menus = config('menu', []);

        if (empty($menus)) {
            return;
        }

        foreach ($menus as $menu) {
            if (!class_exists($menu) || !is_subclass_of($menu, Menu::class)) {
                throw new Exception(sprintf(__('Menu class %s does not exist.', 'kirki-ecommerce'), $menu));
            }

            $menu_instance = new $menu();

            if ($menu_instance->is_displayable()) {
                $menu_instance->render();
            };
        }
    }
}
