<?php

/**
 * Replace site title with seo title
 *
 * @package Kirki\Ecommerce\App\Hooks\Filters
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Filters;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\App\Supports\Utils;

use function Kirki\Ecommerce\Framework\view_data;

/**
 * Replaces the document title on product, account, login and register pages.
 *
 * @since 1.0.0
 */
class ReplaceSiteTitle extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return WPHookNames::PRE_GET_DOCUMENT_TITLE;
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
     * Resolve the document title for the current route.
     *
     * Responds to pre_get_document_title. Uses the product SEO title (or its title plus the
     * site name), or the account, login and register page title plus the site name.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments; the first is the title so far.
     * @return string The replacement title, or the incoming title when no route matches.
     */
    public function handle(...$args)
    {
        $title = $args[0];
        $site_name = get_bloginfo('name');

        if (Route::is('shop.single')) {
            $product = view_data();
            if (count($product)) {
                if (!empty($product['seo_title'])) {
                    return $product['seo_title'];
                } elseif (!empty($product['title'])) {
                    return $product['title'] . ' - ' . $site_name;
                }
            }
        }

        // Account routes
        $account_routes = Utils::get_account_route_config();
        foreach ($account_routes as $page) {
            if (!empty($page['route_name']) && Route::is($page['route_name'])) {
                return ($page['title'] ?? '') . ' - ' . $site_name;
            }
        }

        // Login / Register routes
        if (Route::is('login')) {
            return __('Login', 'kirki-ecommerce') . ' - ' . $site_name;
        }

        if (Route::is('register')) {
            return __('Register', 'kirki-ecommerce') . ' - ' . $site_name;
        }

        return $title;
    }
}
