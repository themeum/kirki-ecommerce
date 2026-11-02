<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Filters;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Email\CustomerUserNotification;
use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Events\User\CustomerPasswordResetRequestedEvent;
use Kirki\Ecommerce\App\Wordpress\Hooks\Concerns\TakesOverCoreUserEmails;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Replaces the WordPress password reset email with the store's queued one for customers.
 *
 * @since 1.0.0
 */
class SendCustomerPasswordResetEmail extends BaseHook
{
    use TakesOverCoreUserEmails;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::SEND_RETRIEVE_PASSWORD_EMAIL;
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
        return 3;
    }

    /**
     * Queue the store's reset-password email and stop the core one when the store takes over.
     *
     * Runs on the `send_retrieve_password_email` filter, added in WordPress 6.0.
     * The reset key core generated before this filter is replaced by the one the
     * queued job generates, which is harmless because core's key is never sent.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Filter arguments: whether to send the core email, the user login and the WP_User.
     * @return bool Whether WordPress should still send its own reset email.
     */
    public function handle(...$args)
    {
        [$send, , $user] = array_pad($args, 3, null);

        if (!$this->takes_over_core_email($user, $this->option_key(), '6.0')) {
            return $send;
        }

        CustomerPasswordResetRequestedEvent::dispatch((int) $user->ID);

        return false;
    }

    /**
     * Get the settings key of the customer reset-password notification.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function option_key()
    {
        return CustomerUserNotification::get_type() . '.' . CustomerUserNotification::get_group() . '.' . CustomerUserNotification::RESET_PASSWORD;
    }
}
