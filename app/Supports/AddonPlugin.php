<?php

namespace Kirki\Ecommerce\App\Supports;

use Automatic_Upgrader_Skin;
use Exception;
use Plugin_Upgrader;

class AddonPlugin
{
    /**
     * Install a plugin from a ZIP URL
     *
     * The destination is overwritten so a retry can recover from an earlier
     * install that copied its files but failed before activation.
     *
     * @param string $url The URL of the ZIP file
     * @param bool $activate Whether to activate the plugin after installation
     * @return bool True if the plugin was installed successfully
     * @throws Exception If the plugin installation fails
     */
    public static function install(string $url, bool $activate = true)
    {
        if (empty($url)) {
            throw new Exception(__('No ZIP URL provided', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        include_once ABSPATH . 'wp-admin/includes/file.php';
        include_once ABSPATH . 'wp-admin/includes/plugin-install.php';

        $skin = new Automatic_Upgrader_Skin();
        $upgrader = new Plugin_Upgrader($skin);

        $result = $upgrader->install($url, ['overwrite_package' => true]);

        if (empty($result)) {
            throw new Exception(__('Plugin installation failed', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        if (is_wp_error($result)) {
            throw new Exception($result->get_error_message()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        if (!$activate) {
            return true;
        }

        $plugin_path = $upgrader->plugin_info();

        if (!$plugin_path) {
            throw new Exception(__('Could not determine plugin path.', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $activation_result = activate_plugin($plugin_path);

        if (is_wp_error($activation_result)) {
            throw new Exception($activation_result->get_error_message()); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return true;
    }
}
