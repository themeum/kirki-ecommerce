<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

class MailFromName extends BaseHook
{
    public function get_name(): string
    {
        return HookNames::WP_MAIL_FROM_NAME;
    }

    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    public function handle(...$args)
    {
        $default = $args[0];
        $config = Settings::get(OptionKeys::EMAIL_SETTINGS);
        $from_name = $config->get('mail_configuration.from_name');

        if (!empty($from_name)) {
            return $from_name;
        }

        $from_name = get_bloginfo('name');

        return !empty($from_name) ? $from_name : $default;
    }
}
