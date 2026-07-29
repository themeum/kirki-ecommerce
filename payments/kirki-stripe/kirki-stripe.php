<?php

/**
 * Plugin Name:       Kirki Stripe
 * Plugin URI:        https://kirki.com/
 * Description:       Stripe payment gateway for Kirki ecommerce.
 * Version:           1.0.0
 * Author:            Kirki
 * Author URI:        https://kirki.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       kirki-stripe
 */

use Kirki\Ecommerce\App\Constants\HookNames;
use Kirki\Ecommerce\Payments\Stripe;

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';

add_filter(HookNames::ECOMMERCE_ALL_PAYMENT_GATEWAYS, function ($gateways) {
    $gateways[] = new Stripe();

    return $gateways;
});
