<?php

/**
 * Customize WP Admin Bar for Kirki Ecommerce pages
 *
 * @package Kirki\Ecommerce\App\Hooks\Actions
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Actions;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\view_data;

class CustomizeAdminBar extends BaseHook
{
    public function get_name(): string
    {
        return WPHookNames::ADMIN_BAR_MENU;
    }

    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    public function get_priority(): int
    {
        return 90;
    }

    public function handle(...$args)
    {
        if (! is_admin_bar_showing() || ! current_user_can('manage_options')) {
            return;
        }

        if (! Route::is('shop.single')) {
            return;
        }

        $product = view_data();

        if (empty($product['id'])) {
            return;
        }

        $wp_admin_bar = $args[0] ?? null;
        if (! ($wp_admin_bar instanceof \WP_Admin_Bar)) {
            global $wp_admin_bar;
        }

        if ($wp_admin_bar instanceof \WP_Admin_Bar) {
            $wp_admin_bar->add_node([
                'id'    => 'edit',
                'title' => __('Edit Product', 'kirki-ecommerce'),
                'href'  => Url::get_admin_product_edit_url($product['id']),
            ]);
        }
    }
}
