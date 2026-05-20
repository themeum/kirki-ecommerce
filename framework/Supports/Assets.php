<?php

namespace Kirki\Ecommerce\Supports;

class Assets
{
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
