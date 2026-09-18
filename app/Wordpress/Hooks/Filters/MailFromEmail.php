<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

class MailFromEmail extends BaseHook
{
    public function get_name(): string
    {
        return HookNames::WP_MAIL_FROM;
    }

    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    public function handle(...$args)
    {
        $default = $args[0];
        $config = Settings::get(OptionKeys::EMAIL_SETTINGS);
        $from_email = $config->get('mail_configuration.from_email');

        if (!empty($from_email)) {
            return $from_email;
        }

        $admin_email = get_bloginfo('admin_email');

        return !empty($admin_email) ? $admin_email : $default;
    }
}
