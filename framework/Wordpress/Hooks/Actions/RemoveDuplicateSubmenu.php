<?php

namespace Kirki\Ecommerce\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Wordpress\BaseHook;

class RemoveDuplicateSubmenu extends BaseHook
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
        remove_submenu_page('ecommerce', 'ecommerce');
    }
}
