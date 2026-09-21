<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Filters the sender email address of outgoing mail to the one saved in the plugin's email settings.
 *
 * @since 1.0.0
 */
class MailFromEmail extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return HookNames::WP_MAIL_FROM;
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
     * Resolve the sender email address for outgoing mail.
     *
     * Runs on the `wp_mail_from` filter. Prefers the configured from email, then the site admin email.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Filter arguments; the first is the address WordPress would otherwise use.
     * @return string Sender email address, falling back to the original address.
     */
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
