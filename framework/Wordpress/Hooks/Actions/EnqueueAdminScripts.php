<?php

namespace Kirki\Ecommerce\Wordpress\Hooks\Actions;

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
    private const VITE_DEV_SERVER = 'http://localhost:5173';

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
        wp_enqueue_script('wp-tinymce');
        wp_enqueue_editor();
        wp_enqueue_media();

        if (defined('KIRKI_ECOMMERCE_IS_DEV') && KIRKI_ECOMMERCE_IS_DEV) {
            $this->enqueue_vite_dev_scripts();
            return;
        }

        $this->enqueue_production_scripts();
    }

    private function enqueue_vite_dev_scripts()
    {
        add_action('admin_print_footer_scripts', [$this, 'print_react_refresh_preamble'], 1);

        wp_enqueue_script(
            KIRKI_ECOMMERCE_PREFIX . 'vite-client',
            self::VITE_DEV_SERVER . '/@vite/client',
            [],
            null,
            true
        );

        wp_enqueue_script(
            KIRKI_ECOMMERCE_PREFIX . 'app',
            self::VITE_DEV_SERVER . '/main.jsx',
            [KIRKI_ECOMMERCE_PREFIX . 'vite-client'],
            null,
            true
        );

        add_filter('script_loader_tag', [$this, 'add_module_type_to_scripts'], 10, 3);
    }

    private function enqueue_production_scripts()
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

    public function print_react_refresh_preamble()
    {
        $refresh_url = esc_url(self::VITE_DEV_SERVER . '/@react-refresh');
        ?>
        <script type="module">
            import RefreshRuntime from "<?php echo $refresh_url; ?>";
            RefreshRuntime.injectIntoGlobalHook(window);
            window.$RefreshReg$ = () => {};
            window.$RefreshSig$ = () => (type) => type;
            window.__vite_plugin_react_preamble_installed__ = true;
        </script>
        <?php
    }

    public function add_module_type_to_scripts($tag, $handle, $src)
    {
        $handles = [
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
