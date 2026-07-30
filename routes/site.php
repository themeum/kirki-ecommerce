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
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Supports\Arr;

Route::set_site_namespace('kirki_ecommerce');
Route::set_routing_method(Route::ROUTING_PARSE_REQUEST);

Route::site(function () {
    // TODO: Remove these default values once page generation via settings is implemented.
    $options = get_option('kirki_ecommerce_advance', []);
    $shop_page_id = Arr::get($options, 'pages.shop_page', 0);
    $cart_page_id = Arr::get($options, 'pages.cart_page', 0);
    $checkout_page_id = Arr::get($options, 'pages.checkout_page', 0);
    $account_page_id = Arr::get($options, 'pages.account_page', 0);
    $design_system_page_id = Arr::get($options, 'pages.design_system_page', 0);

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
        ->name('checkout')
        ->match_page();

    Route::get($account_page_id, [SiteController::class, 'account_page'])
        ->middleware(SiteAuthMiddleware::class)
        ->name('account')
        ->match_page();

    Route::get($design_system_page_id, [SiteController::class, 'design_system_page'])
        ->middleware(SiteAuthMiddleware::class)
        ->name('design_system')
        ->match_page();
});
