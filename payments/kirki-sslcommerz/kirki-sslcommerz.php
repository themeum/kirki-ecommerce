<?php

/**
 * Plugin Name:       Kirki SSLCommerz
 * Plugin URI:        https://kirki.com/
 * Description:       SSLCommerz payment gateway for Kirki ecommerce.
 * Version:           1.0.0
 * Order:             120
 * Author:            Kirki
 * Author URI:        https://kirki.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       kirki-ecommerce-sslcommerz
 * Requires Plugins:  kirki-ecommerce
 */

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\Payments\Sslcommerz;

defined('ABSPATH') || exit;

require_once __DIR__ . '/vendor/autoload.php';

add_action('plugins_loaded', 'kirki_sslcommerz_register_payment_provider');
register_activation_hook(__FILE__, 'kirki_sslcommerz_register_payment_provider');

/**
 * Register the SSLCommerz payment provider with kirki-ecommerce.
 *
 * @return void
 */
function kirki_sslcommerz_register_payment_provider()
{
    if (!class_exists(DevHookNames::class)) {
        return;
    }

    add_filter(DevHookNames::PAYMENT_PROVIDERS, function ($providers) {
        $providers[Sslcommerz::class] = new Sslcommerz();

        return $providers;
    });
}
