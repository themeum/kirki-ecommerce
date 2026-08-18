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

use Kirki\Ecommerce\App\Http\Controllers\Site\AccountController;
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
    $login_page_id = Utils::get_login_page_id();
    $register_page_id = Utils::get_registration_page_id();

    $shop_page = get_post($shop_page_id);
    $shop_page_slug = !empty($shop_page) ? $shop_page->post_name : 'shop';

    $login_page = get_post($login_page_id);
    $login_page_slug = !empty($login_page) ? $login_page->post_name : 'login';

    $register_page = get_post($register_page_id);
    $register_page_slug = !empty($register_page) ? $register_page->post_name : 'register';

    Route::get($login_page_slug, [SiteController::class, 'login_page'])
        ->name('login');

    Route::post($login_page_slug, [SiteController::class, 'handle_login'])
        ->template_redirect()
        ->name('login');

    Route::get($register_page_slug, [SiteController::class, 'register_page'])
        ->name('register');

    Route::post($register_page_slug, [SiteController::class, 'handle_registration'])
        ->template_redirect()
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
});

// Customer account routes.
Route::site(function () {
    $account_pages = Utils::get_account_pages();
    $account_page = $account_pages['dashboard'];
    $account_page_slug = $account_page['route_path'];

    Route::get($account_page_slug, $account_page['callback'])
        ->middleware(SiteAuthMiddleware::class)
        ->name($account_page['route_name']);

    foreach ($account_pages as $key => $page) {
        if (isset($page['callback']) && $page['callback']) {
            Route::get($page['route_path'], $page['callback'])
                ->middleware(SiteAuthMiddleware::class)
                ->name($page['route_name']);
        }
    }

    Route::get($account_page_slug . '/orders/{uuid}', [AccountController::class, 'order_details'])
        ->middleware(SiteAuthMiddleware::class)
        ->template_redirect()
        ->name('account.orders.show');
});
