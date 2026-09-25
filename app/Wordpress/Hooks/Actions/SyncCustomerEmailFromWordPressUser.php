<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;

use function Kirki\Ecommerce\Framework\app;

/**
 * Pushes a WordPress user's changed email onto its linked customer.
 *
 * @since 1.0.0
 */
class SyncCustomerEmailFromWordPressUser extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::PROFILE_UPDATE;
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
        return 2;
    }

    /**
     * Update the linked customer's email when the WordPress user's email changed.
     *
     * Runs on the `profile_update` action, which fires with the user's ID and
     * their previous data. Does nothing when the email is unchanged.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments: the user ID and their old \WP_User data.
     * @return void
     */
    public function handle(...$args)
    {
        [$user_id, $old_user_data] = $args;

        $user = get_userdata($user_id);

        if (empty($user) || $user->user_email === $old_user_data->user_email) {
            return;
        }

        app(CustomerService::class)->sync_email_from_wordpress_user($user_id, $user->user_email);
    }
}
