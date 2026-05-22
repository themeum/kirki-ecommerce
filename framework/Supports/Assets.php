<?php

namespace Kirki\Ecommerce\Supports;

class Assets
{
    const ADMIN_PAGE = 'ecommerce';

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
            'rest_url_base' => esc_url(rest_url() . 'kirki/ecommerce/v1'),
            'nonce' => esc_attr(wp_create_nonce('wp_rest')),
            'version' => KIRKI_ECOMMERCE_VERSION,
        ];

        return sprintf(
            'window.kirki_ecommerce = %s;',
            Arr::json_encode($config_data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );
    }
}
