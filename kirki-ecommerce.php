<?php

/**
 * Plugin Name:       Kirki eCommerce
 * Plugin URI:        https://kirki.com
 * Description:       Kirki eCommerce is an all-in-one solution that empowers users to build and run professional online stores with an intuitive UX, modern UI, and lightning-fast performance.
 * Version:           1.0.0-beta.1
 * Author:            Kirki
 * Author URI:        https://kirki.com
 * Text Domain:       kirki-ecommerce
 * Requires PHP:      7.4
 * Requires at least: 6.8
 * Tested up to:      7.1
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Domain Path:       /languages
 *
 * @package Kirki\Ecommerce
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\KirkiEcommerce;

/**
 * The kirki ecommerce plugin version
 * @var string
 */
define('KIRKI_ECOMMERCE_VERSION', '1.0.0-beta.1');

/**
 * The kirki ecommerce plugin slug
 * @var string
 */
define('KIRKI_ECOMMERCE_SLUG', 'kirki-ecommerce');

/**
 * The kirki ecommerce plugin file
 * @var string
 */
define('KIRKI_ECOMMERCE_PLUGIN_FILE', __FILE__);

/**
 * The kirki ecommerce plugin path
 * @var string
 */
define('KIRKI_ECOMMERCE_PLUGIN_PATH', plugin_dir_path(KIRKI_ECOMMERCE_PLUGIN_FILE));

/**
 * The kirki ecommerce plugin assets url
 * @var string
 */
$kecom_relative_path = str_replace(WP_CONTENT_DIR, '', KIRKI_ECOMMERCE_PLUGIN_PATH);

/**
 * The kirki ecommerce plugin assets path
 * @var string
 */
define('KIRKI_ECOMMERCE_ASSETS_URL', WP_CONTENT_URL . $kecom_relative_path . 'assets');

/**
 * The kirki ecommerce plugin assets path
 * @var string
 */
define('KIRKI_ECOMMERCE_ASSETS_PATH', KIRKI_ECOMMERCE_PLUGIN_PATH . '/assets');

/**
 * The kirki ecommerce plugin prefix
 * @var string
 */
define('KIRKI_ECOMMERCE_PREFIX', 'kirki_ecommerce_');

/**
 * The kirki ecommerce plugin mode
 * @var string
 */
define('KIRKI_ECOMMERCE_MODE', 'development');

require_once KIRKI_ECOMMERCE_PLUGIN_PATH . '/vendor/autoload.php';

// Register activation, deactivation, and uninstall hooks
register_activation_hook(KIRKI_ECOMMERCE_PLUGIN_FILE, [KirkiEcommerce::class, 'handle_activation']);
register_deactivation_hook(KIRKI_ECOMMERCE_PLUGIN_FILE, [KirkiEcommerce::class, 'handle_deactivation']);
register_uninstall_hook(KIRKI_ECOMMERCE_PLUGIN_FILE, [KirkiEcommerce::class, 'handle_uninstallation']);

// Booting the plugin application
add_action('init', 'kirki_ecommerce_boot_application', 0);

function kirki_ecommerce_boot_application()
{
    // Do not call bootstrap_path() yet —
    // Application instance must be created with the base path before its path helpers are available.
    // Only after instantiation can you safely use bootstrap_path() to resolve the bootstrap directory.
    require_once KIRKI_ECOMMERCE_PLUGIN_PATH . '/bootstrap/app.php';
}
