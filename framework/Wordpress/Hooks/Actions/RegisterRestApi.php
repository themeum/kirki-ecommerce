<?php

namespace Kirki\Ecommerce\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Wordpress\BaseHook;
use Kirki\Ecommerce\Route;

class RegisterRestApi extends BaseHook
{
    public function get_name()
    {
        return HookNames::REST_API_INIT;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        $routes = Route::get_routes();

        foreach ($routes as $route) {
            $route->register();
        }
    }
}
