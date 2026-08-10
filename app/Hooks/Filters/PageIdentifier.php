<?php

/**
 * Add page identifier in admin pages list.
 *
 * @package Kirki\Ecommerce\App\Hooks\Filters
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Filters;

use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

class PageIdentifier extends BaseHook
{
    public function get_name(): string
    {
        //@TODO: need to add this to Hooks constants.
        return 'display_post_states';
    }

    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    public function get_args_count()
    {
        return 2;
    }

    public function handle(...$args)
    {
        $post_states = $args[0];
        if (!is_admin() || ! isset($_GET['post_type'])) {
            return $args[0];
        }

        $post = $args[1];

        $shop_page_id = Utils::get_shop_page_id();
        $cart_page_id = Utils::get_cart_page_id();
        $checkout_page_id = Utils::get_checkout_page_id();
        $account_page_id = Utils::get_account_page_id();
        $design_system_page_id = Utils::get_design_system_page_id();

        if ($shop_page_id === $post->ID) {
            $post_states['kirki_ecommerce_shop'] = __('Shop Page', 'kirki-ecommerce');
        }

        if ($cart_page_id === $post->ID) {
            $post_states['kirki_ecommerce_cart'] = __('Cart Page', 'kirki-ecommerce');
        }

        if ($checkout_page_id === $post->ID) {
            $post_states['kirki_ecommerce_checkout'] = __('Checkout Page', 'kirki-ecommerce');
        }

        if ($account_page_id === $post->ID) {
            $post_states['kirki_ecommerce_account'] = __('Account Page', 'kirki-ecommerce');
        }

        if ($design_system_page_id === $post->ID) {
            $post_states['kirki_ecommerce_design_system'] = __('Design System Page', 'kirki-ecommerce');
        }

        return $post_states;
    }
}
