<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Email\CustomerUserNotification;
use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Events\User\CustomerAccountCreatedEvent;
use Kirki\Ecommerce\App\Wordpress\Hooks\Concerns\TakesOverCoreUserEmails;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Queues the store's new-account email for every new customer account.
 *
 * Pairs with SuppressCoreNewUserEmail, which stops WordPress's own email to
 * the user under the same conditions.
 *
 * @since 1.0.0
 */
class SendCustomerNewAccountEmail extends BaseHook
{
    use TakesOverCoreUserEmails;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::USER_REGISTER;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return HookTypes::ACTION;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_args_count()
    {
        return 1;
    }

    /**
     * Dispatch the new-account event when the store takes over the new user's email.
     *
     * Runs on the `user_register` action, which fires after the user's role is
     * set, for self-registered and admin-created users alike.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments: the new user's ID.
     * @return void
     */
    public function handle(...$args)
    {
        [$user_id] = $args;

        if (!$this->takes_over_core_email(get_userdata((int) $user_id) ?: null, static::option_key(), '6.1')) {
            return;
        }

        CustomerAccountCreatedEvent::dispatch((int) $user_id);
    }

    /**
     * Get the settings key of the customer new-account notification.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function option_key()
    {
        return CustomerUserNotification::get_type() . '.' . CustomerUserNotification::get_group() . '.' . CustomerUserNotification::NEW_CUSTOMER_ACCOUNT;
    }
}
