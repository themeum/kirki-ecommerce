<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Wordpress\Hooks\Actions\SendCustomerNewAccountEmail;
use Kirki\Ecommerce\App\Wordpress\Hooks\Concerns\TakesOverCoreUserEmails;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Stops WordPress's own new-user email to a customer the store sends its new-account email to.
 *
 * @since 1.0.0
 */
class SuppressCoreNewUserEmail extends BaseHook
{
    use TakesOverCoreUserEmails;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::WP_SEND_NEW_USER_NOTIFICATION_TO_USER;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return HookTypes::FILTER;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_args_count()
    {
        return 2;
    }

    /**
     * Stop the core new-user email when the store's new-account email replaces it.
     *
     * Runs on the `wp_send_new_user_notification_to_user` filter, added in
     * WordPress 6.1. Core checks it before generating its own password key, so
     * suppressing the email also stops that competing key.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Filter arguments: whether to send the core email and the WP_User.
     * @return bool Whether WordPress should still send its own new-user email.
     */
    public function handle(...$args)
    {
        [$send, $user] = array_pad($args, 2, null);

        return $this->takes_over_core_email($user, SendCustomerNewAccountEmail::option_key(), '6.1') ? false : $send;
    }
}
