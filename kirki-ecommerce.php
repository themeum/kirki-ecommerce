<?php

/**
 * Plugin Name:       Kirki Ecommerce
 * Plugin URI:        https://ecommerce.kirki.com
 * Description:       Kirki Ecommerce is a full-featured e-commerce solution with superior UX, UI, and lightning-fast functionality.
 * Version:           1.0.0-alpha.1
 * Author:            Themeum
 * Author URI:        https://themeum.com
 * Text Domain:       kirki-ecommerce
 * Requires PHP:      7.4
 * Requires at least: 5.9
 * Tested up to:      6.9
 * License:           GPLv2 or later
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Domain Path:       /languages
 *
 * @package Kirki\Ecommerce
 */

if (!defined('ABSPATH')) {
    exit;
}

use Kirki\Ecommerce\App\KirkiEcommerce;

use function Kirki\Ecommerce\Framework\bootstrap_path;

/**
 * The kirki ecommerce plugin version
 * @var string
 */
define('KIRKI_ECOMMERCE_VERSION', '1.0.0-alpha.1');

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
$relative_path = str_replace(WP_CONTENT_DIR, '', KIRKI_ECOMMERCE_PLUGIN_PATH);

/**
 * The kirki ecommerce plugin assets path
 * @var string
 */
define('KIRKI_ECOMMERCE_ASSETS_URL', WP_CONTENT_URL . $relative_path . 'assets');

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

// Set UTC as default timezone for the application
date_default_timezone_set('UTC');

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
