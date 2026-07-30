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

Route::set_site_namespace('kirki_ecommerce');
Route::set_routing_method(Route::ROUTING_PARSE_REQUEST);

Route::site(function () {
    // TODO: Remove these default values once page generation via settings is implemented.
    $shop_page_id = Settings::get('product')->get('shop_page', 18);
    $cart_page_id = Settings::get('product')->get('cart_page', 32);
    $checkout_page_id = Settings::get('product')->get('checkout_page', 2);
    $account_page_id = Settings::get('product')->get('account_page', 52);

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
});
