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

use Kirki\Ecommerce\App\Constants\HookNames;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Wordpress\User;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\app;

class MergeGuestOrder extends BaseHook
{
    public function get_name(): string
    {
        return HookNames::USER_EMAIL_VERIFIED;
    }

    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        $user = $args[0];
        if (!$user instanceof User) {
            return;
        }

        app(OrderService::class)->merge_guest_orders($user->get_id());
    }
}
