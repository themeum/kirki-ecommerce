<?php

/**
 * Plugin Name:       Load Kirki Payment Gateways
 * Plugin URI:        https://kirki.com/
 * Description:       Development tool that lists the payment gateways bundled in kirki-ecommerce/payments on the Plugins screen.
 * Version:           1.0.0
 * Author:            Themeum
 * Author URI:        https://www.themeum.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       load-kirki-payment-gateways
 * Requires Plugins:  kirki-ecommerce
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_init', 'load_kirki_payment_gateways_register');
add_filter('plugin_action_links', 'load_kirki_payment_gateways_remove_delete_link', 10, 2);

/**
 * Make the bundled payment gateway plugins discoverable by WordPress.
 *
 * @return void
 * @since 1.0.0
 */
function load_kirki_payment_gateways_register()
{
    if (!defined('KIRKI_ECOMMERCE_PLUGIN_PATH') || !defined('KIRKI_ECOMMERCE_MODE')) {
        return;
    }

    if (KIRKI_ECOMMERCE_MODE !== 'development') {
        return;
    }

    $plugin_paths = glob(KIRKI_ECOMMERCE_PLUGIN_PATH . 'payments/kirki-*/kirki-*.php') ?: [];

    if (empty($plugin_paths)) {
        return;
    }

    $plugins = get_plugins();

    foreach ($plugin_paths as $plugin_path) {
        $plugins[plugin_basename($plugin_path)] = get_plugin_data($plugin_path, false, false);
    }

    $cache = wp_cache_get('plugins', 'plugins');
    $cache[''] = $plugins;
    wp_cache_set('plugins', $cache, 'plugins');
}

/**
 * Remove the delete link from the bundled payment gateway plugins.
 *
 * @param array  $actions     Action links of the plugin row.
 * @param string $plugin_file Plugin file relative to the plugins directory.
 *
 * @return array
 * @since 1.0.0
 */
function load_kirki_payment_gateways_remove_delete_link($actions, $plugin_file)
{
    if (!defined('KIRKI_ECOMMERCE_PLUGIN_PATH') || !defined('KIRKI_ECOMMERCE_MODE')) {
        return $actions;
    }

    if (KIRKI_ECOMMERCE_MODE !== 'development') {
        return $actions;
    }

    $payments_directory = plugin_basename(KIRKI_ECOMMERCE_PLUGIN_PATH . 'payments') . '/';

    if (strpos($plugin_file, $payments_directory) === 0) {
        unset($actions['delete']);
    }

    return $actions;
}
