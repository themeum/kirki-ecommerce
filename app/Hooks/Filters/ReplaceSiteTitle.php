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

use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\App\Supports\Utils;

use function Kirki\Ecommerce\Framework\view_data;

class ReplaceSiteTitle extends BaseHook
{
    public function get_name(): string
    {
        //@TODO: need to add this to Hooks constants.
        return 'pre_get_document_title';
    }

    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

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
