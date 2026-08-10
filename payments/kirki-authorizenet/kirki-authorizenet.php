<?php

/**
 * Plugin Name:       Kirki AuthorizeNet
 * Plugin URI:        https://kirki.com/
 * Description:       AuthorizeNet payment gateway for Kirki ecommerce.
 * Version:           1.0.0
 * Author:            Kirki
 * Author URI:        https://kirki.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       kirki-ecommerce-authorizenet
 * Requires Plugins:  kirki-ecommerce
 */

use Kirki\Ecommerce\App\Constants\HookNames;
use Kirki\Ecommerce\Payments\Authorizenet;

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';

add_action('plugins_loaded', function () {
    if (!class_exists(HookNames::class)) {
        return;
    }

    add_filter(HookNames::ECOMMERCE_PAYMENT_PROVIDERS, function ($gateways) {
        $gateways[] = new Authorizenet();

        return $gateways;
    });
});
