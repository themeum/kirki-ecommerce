<?php

namespace Kirki\Ecommerce\App;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Onboarding;
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
     * Queues a one-time redirect to the onboarding wizard for an interactive,
     * single-site activation of a store that has not been onboarded. The
     * application is not booted during activation, so the completion option is
     * read directly.
     *
     * @since 1.0.0
     *
     * @param bool $network_wide Whether the plugin is being activated for the whole network.
     * @return void
     */
    public static function handle_activation($network_wide = false)
    {
        if ($network_wide || (defined('WP_CLI') && \WP_CLI)) {
            return;
        }

        if (!empty(get_option(KIRKI_ECOMMERCE_PREFIX . OptionKeys::ONBOARDING_COMPLETED_AT))) {
            return;
        }

        set_transient(Onboarding::ACTIVATION_REDIRECT_TRANSIENT, 1, 30);
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
