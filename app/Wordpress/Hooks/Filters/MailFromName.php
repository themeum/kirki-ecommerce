<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Filters the sender name of outgoing mail to the one saved in the plugin's email settings.
 *
 * @since 1.0.0
 */
class MailFromName extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return HookNames::WP_MAIL_FROM_NAME;
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
     * Resolve the sender name for outgoing mail.
     *
     * Runs on the `wp_mail_from_name` filter. Prefers the configured from name, then the site name.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Filter arguments; the first is the name WordPress would otherwise use.
     * @return string Sender name, falling back to the original name.
     */
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
