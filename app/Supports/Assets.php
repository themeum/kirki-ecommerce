<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\Framework\Supports\Arr;

use function Kirki\Ecommerce\Framework\app;

class Assets
{
    const ADMIN_PAGE = 'kirki-ecommerce';

    /**
     * Get assets URL.
     *
     * @since 1.0.0
     *
     * @param string $path Path to append to the assets URL.
     *
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
     *
     * @return string
     */
    public static function get_path($path = '')
    {
        $path = trim($path, '/');
        return KIRKI_ECOMMERCE_ASSETS_PATH . ($path ? '/' . $path : '');
    }

    public static function is_admin_page()
    {
        if (!is_admin()) {
            return false;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only admin screen detection.
        if (!isset($_GET['page'])) {
            return false;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only admin screen detection.
        $page = sanitize_text_field(wp_unslash($_GET['page']));

        return static::ADMIN_PAGE === $page;
    }

    public static function get_kirki_ecommerce_configs()
    {
        $config_data = [
            'site_url' => esc_url(site_url()),
            'ajax_nonce' => esc_attr(wp_create_nonce('kirki_ecommerce_nonce')),
            'ajax_url' => esc_url(admin_url('admin-ajax.php')),
            'rest_nonce' => esc_attr(wp_create_nonce('wp_rest')),
            'rest_url_base' => esc_url(rest_url() . 'kirki/ecommerce/v1'),
            'version' => app()->version(),
            'is_dev' => app()->is_dev_mode(),
            'is_logged_in' => is_user_logged_in(),
            'login_url' => esc_url(wp_login_url()),
        ];

        $config_data = apply_filters('kirki_ecommerce_config_data', $config_data);

        return sprintf(
            'window.kirki_ecommerce = %s;',
            Arr::json_encode($config_data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );
    }
}
