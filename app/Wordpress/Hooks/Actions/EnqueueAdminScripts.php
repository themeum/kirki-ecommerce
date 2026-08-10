<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookNames;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;

use function Kirki\Ecommerce\Framework\app;

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

        if (app()->is_dev_mode()) {
            $this->enqueue_vite_dev_scripts();
            return;
        }

        $this->enqueue_production_scripts();
    }

    protected function enqueue_vite_dev_scripts()
    {
        $vite_refresh_handle = app()->prefix() . 'vite-refresh';

        wp_enqueue_script(
            $vite_refresh_handle,
            esc_url($this->get_vite_refresh_script_url()),
            [],
            app()->version(),
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
            app()->prefix() . 'vite-client',
            static::VITE_DEV_SERVER . '/@vite/client',
            [$vite_refresh_handle],
            null,
            true
        );

        wp_enqueue_script(
            app()->prefix() . 'app',
            static::VITE_DEV_SERVER . '/main.tsx',
            [app()->prefix() . 'vite-client'],
            null,
            true
        );

        add_filter('wp_script_attributes', [$this, 'add_module_type_to_scripts']);
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
        /*
         * No version query string: the built bundle/vendor files are also
         * cross-referenced by relative ES module imports from the lazy page
         * chunks (e.g. `from "../kirki-ecommerce.bundle.js"`), which never
         * carry a query string. If the `<script src>` tag here added one,
         * the browser would treat the two as different module URLs and
         * execute the entry chunk's top-level code (createRoot().render())
         * a second time, producing a second React root on the same
         * container and DOM reconciliation errors on navigation.
         */
        wp_enqueue_script(
            app()->prefix() . 'vendor',
            KIRKI_ECOMMERCE_ASSETS_URL . '/js/kirki-ecommerce.vendor.js',
            [],
            null,
            true
        );

        wp_enqueue_script(
            app()->prefix() . 'bundle',
            KIRKI_ECOMMERCE_ASSETS_URL . '/js/kirki-ecommerce.bundle.js',
            [app()->prefix() . 'vendor'],
            null,
            true
        );

        add_filter('wp_script_attributes', [$this, 'add_module_type_to_scripts']);
    }

    /**
     * Mark the app's own scripts as ES modules.
     *
     * Filters `wp_script_attributes` rather than `script_loader_tag` because the
     * latter receives the handle's inline before/after scripts concatenated with
     * the `<script src>` tag, so any tag rewriting there also hits the inline
     * config and localization snippets.
     *
     * @param array $attributes
     *
     * @return array
     */
    public function add_module_type_to_scripts($attributes)
    {
        $handles = [
            app()->prefix() . 'vite-refresh',
            app()->prefix() . 'vite-client',
            app()->prefix() . 'app',
            app()->prefix() . 'vendor',
            app()->prefix() . 'bundle',
        ];

        if (!isset($attributes['id'])) {
            return $attributes;
        }

        foreach ($handles as $handle) {
            if ($attributes['id'] === $handle . '-js') {
                $attributes['type'] = 'module';
                break;
            }
        }

        return $attributes;
    }
}
