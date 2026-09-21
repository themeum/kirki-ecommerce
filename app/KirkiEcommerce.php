<?php

namespace Kirki\Ecommerce\App;

use Kirki\Ecommerce\App\Scheduler\Scheduler;
use Kirki\Ecommerce\App\Supports\Utils;

use function Kirki\Ecommerce\Framework\migrator;

/**
 * Plugin lifecycle handlers for activation, deactivation and uninstallation.
 *
 * @since 1.0.0
 */
final class KirkiEcommerce
{
    /**
     * Handle plugin activation.
     *
     * Currently a no-op; the setup steps inside are commented out.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function handle_activation()
    {
        // require_once KIRKI_ECOMMERCE_PLUGIN_PATH . '/bootstrap/app.php';

        // migrator()->run();
        // Scheduler::setup();
        // Utils::generate_site_pages();
    }

    /**
     * Handle plugin deactivation.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function handle_deactivation()
    {
        // Deactivation logic here
    }

    /**
     * Handle plugin uninstallation.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function handle_uninstallation()
    {
        // Uninstallation logic here
    }
}
