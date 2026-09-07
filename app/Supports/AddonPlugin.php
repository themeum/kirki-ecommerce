<?php

namespace Kirki\Ecommerce\App\Supports;

use Automatic_Upgrader_Skin;
use Exception;
use Plugin_Upgrader;

use function Kirki\Ecommerce\Framework\throw_if;

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
        throw_if(empty($url), __('No ZIP URL provided', 'kirki-ecommerce'), Exception::class);

        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        include_once ABSPATH . 'wp-admin/includes/file.php';
        include_once ABSPATH . 'wp-admin/includes/plugin-install.php';

        $skin = new Automatic_Upgrader_Skin();
        $upgrader = new Plugin_Upgrader($skin);

        $result = $upgrader->install($url, ['overwrite_package' => true]);

        throw_if(empty($result), __('Plugin installation failed', 'kirki-ecommerce'), Exception::class);

        throw_if(is_wp_error($result), $result->get_error_message(), Exception::class);

        if (!$activate) {
            return true;
        }

        $plugin_path = $upgrader->plugin_info();

        throw_if(!$plugin_path, __('Could not determine plugin path.', 'kirki-ecommerce'), Exception::class);

        $activation_result = activate_plugin($plugin_path);

        throw_if(is_wp_error($activation_result), $activation_result->get_error_message(), Exception::class);

        return true;
    }
}
