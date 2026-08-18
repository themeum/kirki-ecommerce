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

    $shop_page = get_post($shop_page_id);
    $shop_page_slug = !empty($shop_page) ? $shop_page->post_name : 'shop';

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

    Route::get("{$account_page_slug}/orders/{order_number}", [AccountController::class, 'order_details'])
        ->middleware(SiteAuthMiddleware::class)
        ->name('account.orders.details');

    foreach ($account_pages as $key => $page) {
        if (isset($page['callback']) && is_callable($page['callback'])) {
            Route::get($page['route_path'], $page['callback'])
                ->middleware(SiteAuthMiddleware::class)
                ->name($page['route_name']);
        }
    }

    Route::get($account_page_slug . '/orders/{uuid}', [AccountController::class, 'order_details'])
        ->middleware(SiteAuthMiddleware::class)
        ->name('account.orders.show');
});
