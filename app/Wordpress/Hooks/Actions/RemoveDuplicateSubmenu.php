<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;

class RemoveDuplicateSubmenu extends BaseHook
{
    public function get_name()
    {
        return WPHookNames::ADMIN_MENU;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        remove_submenu_page('kirki-ecommerce', 'kirki-ecommerce');
    }
}
