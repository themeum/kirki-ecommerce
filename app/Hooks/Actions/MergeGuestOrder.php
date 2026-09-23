<?php

/**
 * Merge Guest Order
 *
 * @package Kirki\Ecommerce\App\Hooks\Actions
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Actions;

use Kirki\Ecommerce\App\Constants\Hooks\CustomHookNames;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\app;

/**
 * Links a user's earlier guest orders to their account once their email is verified.
 *
 * @since 1.0.0
 */
class MergeGuestOrder extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return CustomHookNames::USER_EMAIL_VERIFIED;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    /**
     * Merge guest orders into the account of the user whose email was just verified.
     *
     * Responds to the kecom_user_email_verified action.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments; the first is the verified User.
     * @return void
     */
    public function handle(...$args)
    {
        $user = $args[0];
        if (!$user instanceof User) {
            return;
        }

        app(OrderService::class)->merge_guest_orders($user->get_id());
    }
}
