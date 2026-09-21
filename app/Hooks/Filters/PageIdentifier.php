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

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Labels the plugin's shop, cart, checkout, account and design system pages in the admin pages list.
 *
 * @since 1.0.0
 */
class PageIdentifier extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return WPHookNames::DISPLAY_POST_STATES;
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
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_args_count()
    {
        return 2;
    }

    /**
     * Add a post state label when the listed page is one of the plugin's pages.
     *
     * Responds to display_post_states. Returns the states unchanged outside wp-admin or when the
     * request has no post_type query argument.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments: the post states array, then the WP_Post being listed.
     * @return array<string, string> Post states, keyed by state slug.
     */
    public function handle(...$args)
    {
        $post_states = $args[0];
        if (!is_admin() || Superglobals::query('post_type') === null) {
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
