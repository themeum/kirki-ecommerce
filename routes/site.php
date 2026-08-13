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
use Kirki\Ecommerce\App\Http\Middlewares\SiteAuthMiddleware;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Route;

Route::set_site_namespace('kirki_ecommerce');
Route::set_routing_method(Route::ROUTING_PARSE_REQUEST);

Route::site(function () {
    $shop_page_id = Utils::get_shop_page_id();
    $cart_page_id = Utils::get_cart_page_id();
    $checkout_page_id = Utils::get_checkout_page_id();
    $account_page_id = Utils::get_account_page_id();
    $design_system_page_id = Utils::get_design_system_page_id();
    $login_page_id = Utils::get_login_page_id();
    $register_page_id = Utils::get_registration_page_id();

    $shop_page = get_post($shop_page_id);
    $shop_page_slug = !empty($shop_page) ? $shop_page->post_name : 'shop';

    $login_page = get_post($login_page_id);
    $login_page_slug = !empty($login_page) ? $login_page->post_name : 'login';

    $register_page = get_post($register_page_id);
    $register_page_slug = !empty($register_page) ? $register_page->post_name : 'register';

    Route::get($login_page_slug, [SiteController::class, 'login_page'])
        ->template_redirect()
        ->name('login');

    Route::post("{$login_page_slug}/process", [SiteController::class, 'handle_login'])
        ->template_redirect()
        ->name('login.user');

    Route::get($register_page_slug, [SiteController::class, 'register_page'])
        ->name('register');

    Route::get($shop_page_slug, [SiteController::class, 'shop_page'])
        ->name('shop')
        ->match_page();

    Route::get("{$shop_page_slug}/{slug}", [SiteController::class, 'shop_single_page'])
        ->name('shop.single');

    Route::get($cart_page_id, [SiteController::class, 'cart_page'])
        ->name('cart')
        ->match_page();

    Route::get($checkout_page_id, [SiteController::class, 'checkout_page'])
        ->middleware(SiteAuthMiddleware::class)
        ->name('checkout')
        ->match_page();

    Route::get($account_page_id, [SiteController::class, 'account_page'])
        ->middleware(SiteAuthMiddleware::class)
        ->name('account')
        ->match_page();

    // TODO: will be removed.
    Route::get($design_system_page_id, [SiteController::class, 'design_system_page'])
        ->middleware(SiteAuthMiddleware::class)
        ->name('design_system')
        ->match_page();
});
