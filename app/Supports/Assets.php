<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Constants\Hooks\CustomHookNames;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Arr;

use function Kirki\Ecommerce\Framework\app;

/**
 * Resolves plugin asset URLs and paths and builds the admin JavaScript config.
 *
 * @since 1.0.0
 */
class Assets
{
    const ADMIN_PAGE = 'kirki-ecommerce';

    /**
     * Get assets URL.
     *
     * @since 1.0.0
     *
     * @param string $path Path to append to the assets URL.
     * @return string
     */
    public static function get_url($path = '')
    {
        $path = trim($path, '/');
        return KIRKI_ECOMMERCE_ASSETS_URL . ($path ? '/' . $path : '');
    }

    /**
     * Get assets path.
     *
     * @since 1.0.0
     *
     * @param string $path Path to append to the assets path.
     * @return string
     */
    public static function get_path($path = '')
    {
        $path = trim($path, '/');
        return KIRKI_ECOMMERCE_ASSETS_PATH . ($path ? '/' . $path : '');
    }

    /**
     * Get the Vite build manifest, mapping each entry/chunk source path to
     * its current content-hashed output file.
     *
     * @since 1.0.0
     *
     * @return array<string, array<string, mixed>> Empty when the manifest is missing or invalid.
     */
    public static function get_manifest()
    {
        static $manifest;

        if ($manifest !== null) {
            return $manifest;
        }

        $manifest_path = static::get_path('.vite/manifest.json');

        if (!file_exists($manifest_path)) {
            return $manifest = [];
        }

        $contents = file_get_contents($manifest_path);
        $decoded = json_decode($contents, true);

        return $manifest = is_array($decoded) ? $decoded : [];
    }

    /**
     * Check whether the current request is the plugin's admin page.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public static function is_admin_page()
    {
        if (!is_admin()) {
            return false;
        }

        $page = Superglobals::query('page', null, Sanitizer::TEXT);

        if ($page === null) {
            return false;
        }

        return static::ADMIN_PAGE === $page;
    }

    /**
     * Build the inline script that exposes the plugin config to the admin app.
     *
     * The config can be modified through the `CustomHookNames::CONFIG_DATA` filter.
     *
     * @since 1.0.0
     *
     * @return string JavaScript assigning the config to `window.kirki_ecommerce`.
     */
    public static function get_kirki_ecommerce_configs()
    {
        $config_data = [
            'site_url' => esc_url(site_url()),
            'kecom_nonce' => esc_attr(wp_create_nonce('kirki_ecommerce_nonce')),
            'ajax_url' => esc_url(admin_url('admin-ajax.php')),
            'rest_nonce' => esc_attr(wp_create_nonce('wp_rest')),
            'rest_url_base' => esc_url(rest_url() . 'kirki/ecommerce/v1'),
            'version' => app()->version(),
            'is_dev' => app()->is_dev_mode(),
            'is_logged_in' => is_user_logged_in(),
            'login_url' => esc_url(wp_login_url()),
        ];

        $config_data = apply_filters(CustomHookNames::CONFIG_DATA, $config_data);

        return sprintf(
            'window.kirki_ecommerce = %s;',
            Arr::json_encode($config_data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );
    }
}
