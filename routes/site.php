<?php

/**
 * Site Routes
 *
 * Registers all frontend site routes used by the plugin.
 *
 * @package Kirki\Ecommerce\Routes
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Http\Controllers\Site\SiteController;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\App\Wordpress\SiteRoute;

$route = new SiteRoute('kirki_ecommerce');
$route->set_routing_method(SiteRoute::ROUTING_PARSE_REQUEST);
$route->set_default_hook(SiteRoute::HOOK_TEMPLATE_INCLUDE);

// TODO: Remove these default values once page generation via settings is implemented.
$shop_page_id = Settings::get('product')->get('shop_page', 13);
$cart_page_id = Settings::get('product')->get('cart_page', 32);
$checkout_page_id = Settings::get('product')->get('checkout_page', 2);
$account_page_id = Settings::get('product')->get('account_page', 52);
$design_system_page_id = Settings::get('product')->get('design_system', 16);

$shop_page = get_post($shop_page_id);
$shop_page_slug = !empty($shop_page) ? $shop_page->post_name : 'shop';

$route->get($shop_page_slug, [SiteController::class, 'shop_page'])
    ->name('shop')
    ->match_using(SiteRoute::MATCH_PAGE);

$route->get($shop_page_slug . '/{slug}', [SiteController::class, 'shop_single_page'])
    ->name('shop.single');

$route->get($cart_page_id, [SiteController::class, 'cart_page'])
    ->name('cart')
    ->match_using(SiteRoute::MATCH_PAGE);

$route->get($checkout_page_id, [SiteController::class, 'checkout_page'])
    ->name('checkout')
    ->match_using(SiteRoute::MATCH_PAGE);

$route->get($account_page_id, [SiteController::class, 'account_page'])
    ->middleware(fn() => is_user_logged_in() ? true : wp_redirect(home_url()))
    ->name('account')
    ->match_using(SiteRoute::MATCH_PAGE);

$route->get($design_system_page_id, [SiteController::class, 'design_system_page'])
    ->name('design_system')
    ->match_using(SiteRoute::MATCH_PAGE);
