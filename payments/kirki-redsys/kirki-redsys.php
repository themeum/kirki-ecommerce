<?php

/**
 * Plugin Name:       Kirki Redsys
 * Plugin URI:        https://kirki.com/
 * Description:       Redsys payment gateway for Kirki ecommerce.
 * Version:           1.0.0
 * Author:            Kirki
 * Author URI:        https://kirki.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       kirki-ecommerce-redsys
 * Requires Plugins:  kirki-ecommerce
 */

use Kirki\Ecommerce\App\Constants\Hooks\CustomHookNames;
use Kirki\Ecommerce\Payments\Redsys;

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';

add_action('plugins_loaded', 'kirki_redsys_register_payment_provider');
register_activation_hook(__FILE__, 'kirki_redsys_register_payment_provider');

/**
 * Register the Redsys payment provider with kirki-ecommerce.
 *
 * @return void
 */
function kirki_redsys_register_payment_provider()
{
    if (!class_exists(CustomHookNames::class)) {
        return;
    }
    add_filter(CustomHookNames::ECOMMERCE_PAYMENT_PROVIDERS, function ($providers) {
        $providers[Redsys::class] = new Redsys();

        return $providers;
    });
}
