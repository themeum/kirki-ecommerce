<?php

/**
 * Plugin Name:       Kirki Klarna
 * Plugin URI:        https://kirki.com/
 * Description:       Klarna payment gateway for Kirki ecommerce.
 * Version:           1.0.0
 * Author:            Kirki
 * Author URI:        https://kirki.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       kirki-ecommerce-klarna
 * Requires Plugins:  kirki-ecommerce
 */

use Kirki\Ecommerce\App\Constants\HookNames;
use Kirki\Ecommerce\Payments\Klarna;
use Kirki\Ecommerce\Payments\Square;

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';

add_action('plugins_loaded', 'kirki_klarna_register_payment_provider');
register_activation_hook(__FILE__, 'kirki_klarna_register_payment_provider');

function kirki_klarna_register_payment_provider()
{
    if (!class_exists(HookNames::class)) {
        return;
    }
    add_filter(HookNames::ECOMMERCE_PAYMENT_PROVIDERS, function ($providers) {
        $providers[Klarna::class] = new Square();

        return $providers;
    });
}
