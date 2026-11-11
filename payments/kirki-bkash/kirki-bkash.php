<?php

/**
 * Plugin Name:       Kirki bKash
 * Plugin URI:        https://kirki.com/
 * Description:       bKash payment gateway for Kirki ecommerce.
 * Version:           1.0.0
 * Order:             110
 * Author:            Kirki
 * Author URI:        https://kirki.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       kirki-ecommerce-bkash
 * Requires Plugins:  kirki-ecommerce
 * Requires Kirki eCommerce: 1.0.1
 */

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\Payments\Bkash;

defined('ABSPATH') || exit;

require_once __DIR__ . '/vendor/autoload.php';

add_action('plugins_loaded', 'kirki_bkash_register_payment_provider');
register_activation_hook(__FILE__, 'kirki_bkash_register_payment_provider');

/**
 * Register the bKash payment provider with kirki-ecommerce.
 *
 * @return void
 */
function kirki_bkash_register_payment_provider()
{
    if (!class_exists(DevHookNames::class)) {
        return;
    }

    add_filter(DevHookNames::PAYMENT_PROVIDERS, function ($providers) {
        $providers[Bkash::class] = new Bkash();

        return $providers;
    });
}
