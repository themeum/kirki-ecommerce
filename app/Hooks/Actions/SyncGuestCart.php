<?php

/**
 * Sync Guest Cart
 *
 * @package Kirki\Ecommerce\App\Hooks\Actions
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Actions;

use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\app;

class SyncGuestCart extends BaseHook
{
    public function get_name(): string
    {
        //@TODO framework should have a constant for this hook name.
        return 'wp_login';
    }

    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    public function get_args_count()
    {
        return 2;
    }

    public function handle(...$args)
    {
        try {
            /**
            * @var string $user_login username.
            */
            $user_login = $args[0];

            /**
            * @var \WP_User $user wp user object.
            */
            $user = $args[1];

            $cart_service = app(CartService::class);
            $cart_service->sync_guest_cart($user_login, $user);
        } catch (\Exception $e) {
            error_log('Error syncing guest cart: ' . $e->getMessage());
        }
    }
}
