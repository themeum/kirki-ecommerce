<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\App\Supports\HtmlStyle;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;

use function Kirki\Ecommerce\Framework\app;

/**
 * Enqueues the admin app's scripts and styles on the plugin's admin pages.
 *
 * @since 1.0.0
 */
class EnqueueAdminScripts extends BaseHook
{
    protected const VITE_DEV_SERVER = 'http://localhost:5173';

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::ADMIN_ENQUEUE_SCRIPT;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return HookTypes::ACTION;
    }

    /**
     * Enqueue the editor and media assets and the admin app bundle on the plugin's admin pages.
     *
     * Runs on the `admin_enqueue_scripts` action. Uses the Vite dev server in dev mode
     * and the built manifest otherwise.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments, unused.
     * @return void
     */
    public function handle(...$args)
    {
        if (!Assets::is_admin_page()) {
            return;
        }

        wp_enqueue_script('wp-tinymce');
        wp_enqueue_editor();
        wp_enqueue_media();

        $admin_style_handle = 'kirki-ecommerce-admin-styles';

        wp_register_style($admin_style_handle, false, [], app()->version());
        wp_enqueue_style($admin_style_handle);
        wp_add_inline_style($admin_style_handle, HtmlStyle::build_style_block(HtmlStyle::richtext_styles()));

        if (app()->is_dev_mode()) {
            $this->enqueue_vite_dev_scripts();
            return;
        }

        $this->enqueue_production_scripts();
    }

    /**
     * Enqueue the app's scripts served by the Vite dev server.
     *
     * @since 1.0.0
     *
     * @return void
     */
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

    /**
     * Get the URL of the bundled Vite refresh helper script.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function get_vite_refresh_script_url()
    {
        return plugins_url(
            'resources/assets/js/kirki-ecommerce-vite-refresh.js',
            KIRKI_ECOMMERCE_PLUGIN_FILE
        );
    }

    /**
     * Enqueue the built vendor chunks and entry bundle listed in the Vite manifest.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function enqueue_production_scripts()
    {
        $manifest = Assets::get_manifest();
        $entry = $manifest['main.tsx'] ?? null;

        if (!$entry) {
            return;
        }

        $vendor_handle = app()->prefix() . 'vendor';
        $dependencies = [];

        foreach ($entry['imports'] ?? [] as $import_key) {
            $chunk = $manifest[$import_key] ?? null;

            if (!$chunk) {
                continue;
            }

            /*
             * No version query string: the manifest already content-hashes
             * this file's name, and the built chunks reference each other
             * through relative ES module imports that never carry a query
             * string. Appending one here would make the `<script src>` URL
             * diverge from those internal import URLs, so the browser would
             * treat them as two different modules and execute the chunk's
             * top-level code twice — for the vendor chunk that means a
             * second React root on the same container and DOM
             * reconciliation errors on navigation.
             */
            wp_enqueue_script(
                $vendor_handle,
                KIRKI_ECOMMERCE_ASSETS_URL . '/' . $chunk['file'],
                [],
                null,
                true
            );

            $dependencies[] = $vendor_handle;
        }

        wp_enqueue_script(
            app()->prefix() . 'bundle',
            KIRKI_ECOMMERCE_ASSETS_URL . '/' . $entry['file'],
            $dependencies,
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
     * @since 1.0.0
     *
     * @param array<string, mixed> $attributes Script tag attributes.
     * @return array<string, mixed> Attributes with `type` set to `module` for the app's handles.
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
