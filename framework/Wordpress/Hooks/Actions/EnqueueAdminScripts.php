<?php

namespace Kirki\Ecommerce\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\Supports\Assets;
use Kirki\Ecommerce\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Wordpress\BaseHook;

/**
 * This hook is responsible for enqueueing the admin script.
 *
 * @since 1.0.0
 */
class EnqueueAdminScripts extends BaseHook
{
    protected const VITE_DEV_SERVER = 'http://localhost:5173';

    public function get_name()
    {
        return HookNames::ADMIN_ENQUEUE_SCRIPT;
    }

    public function get_type()
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        if (!Assets::is_admin_page()) {
            return;
        }

        wp_enqueue_script('wp-tinymce');
        wp_enqueue_editor();
        wp_enqueue_media();

        if (defined('KIRKI_ECOMMERCE_IS_DEV') && KIRKI_ECOMMERCE_IS_DEV) {
            $this->enqueue_vite_dev_scripts();
            return;
        }

        $this->enqueue_production_scripts();
    }

    protected function enqueue_vite_dev_scripts()
    {
        $vite_refresh_handle = KIRKI_ECOMMERCE_PREFIX . 'vite-refresh';

        wp_enqueue_script(
            $vite_refresh_handle,
            esc_url($this->get_vite_refresh_script_url()),
            [],
            KIRKI_ECOMMERCE_VERSION,
            true
        );

        wp_localize_script(
            $vite_refresh_handle,
            'kirkiEcommerceViteRefresh',
            [
                'refreshUrl' => esc_url_raw(static::VITE_DEV_SERVER . '/@react-refresh'),
            ]
        );

        wp_enqueue_script(
            KIRKI_ECOMMERCE_PREFIX . 'vite-client',
            static::VITE_DEV_SERVER . '/@vite/client',
            [$vite_refresh_handle],
            null,
            true
        );

        wp_enqueue_script(
            KIRKI_ECOMMERCE_PREFIX . 'app',
            static::VITE_DEV_SERVER . '/main.jsx',
            [KIRKI_ECOMMERCE_PREFIX . 'vite-client'],
            null,
            true
        );

        add_filter('script_loader_tag', [$this, 'add_module_type_to_scripts'], 10, 3);
    }

    protected function get_vite_refresh_script_url()
    {
        return plugins_url(
            'resources/assets/js/kirki-ecommerce-vite-refresh.js',
            KIRKI_ECOMMERCE_PLUGIN_FILE
        );
    }

    protected function enqueue_production_scripts()
    {
        wp_enqueue_style(
            KIRKI_ECOMMERCE_PREFIX . 'bundle',
            KIRKI_ECOMMERCE_ASSETS_URL . '/css/kirki-ecommerce.bundle.css',
            [],
            KIRKI_ECOMMERCE_VERSION
        );

        wp_enqueue_script(
            KIRKI_ECOMMERCE_PREFIX . 'vendor',
            KIRKI_ECOMMERCE_ASSETS_URL . '/js/kirki-ecommerce.vendor.js',
            [],
            KIRKI_ECOMMERCE_VERSION,
            true
        );

        wp_enqueue_script(
            KIRKI_ECOMMERCE_PREFIX . 'bundle',
            KIRKI_ECOMMERCE_ASSETS_URL . '/js/kirki-ecommerce.bundle.js',
            [KIRKI_ECOMMERCE_PREFIX . 'vendor'],
            KIRKI_ECOMMERCE_VERSION,
            true
        );

        add_filter('script_loader_tag', [$this, 'add_module_type_to_scripts'], 10, 3);
    }

    public function add_module_type_to_scripts($tag, $handle, $src)
    {
        $handles = [
            KIRKI_ECOMMERCE_PREFIX . 'vite-refresh',
            KIRKI_ECOMMERCE_PREFIX . 'vite-client',
            KIRKI_ECOMMERCE_PREFIX . 'app',
            KIRKI_ECOMMERCE_PREFIX . 'vendor',
            KIRKI_ECOMMERCE_PREFIX . 'bundle',
        ];

        if (!in_array($handle, $handles, true)) {
            return $tag;
        }

        if (strpos($tag, 'type=') !== false) {
            return $tag;
        }

        return str_replace('<script ', '<script type="module" ', $tag);
    }
}
