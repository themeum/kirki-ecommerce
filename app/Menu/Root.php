<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

use function Kirki\Ecommerce\Framework\app;

class Root extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::MAIN_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce';

    protected $position = 2;

    protected $icon_url = 'dashicons-kirki-ecommerce';

    public function __construct()
    {
        $this->page_title = __('eCommerce', 'kirki-ecommerce');
        $this->menu_title = __('eCommerce', 'kirki-ecommerce');
        $this->callback = [$this, 'render_page'];

        parent::__construct();

        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets'], 20);
    }

    public function enqueue_admin_assets()
    {
        $menu_style_handle = app()->prefix() . 'admin-menu';

        wp_register_style($menu_style_handle, false, [], app()->version());
        wp_enqueue_style($menu_style_handle);

        wp_add_inline_style(
            $menu_style_handle,
            $this->get_dashicon_inline_styles()
        );

        if (!Assets::is_admin_page()) {
            return;
        }

        add_filter('wp_resource_hints', [$this, 'add_font_resource_hints'], 10, 2);

        wp_enqueue_style(
            app()->prefix() . 'inter-font',
            esc_url(
                'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=block'
            ),
            [],
            null
        );

        $root_style_handle = app()->prefix() . 'root-shell';

        wp_register_style(
            $root_style_handle,
            false,
            [app()->prefix() . 'inter-font'],
            app()->version()
        );
        wp_enqueue_style($root_style_handle);

        wp_add_inline_style(
            $root_style_handle,
            $this->get_root_shell_inline_styles()
        );

        wp_add_inline_script(
            $this->get_app_script_handle(),
            Assets::get_kirki_ecommerce_configs(),
            'before'
        );
    }

    protected function is_ecommerce_admin_page()
    {
        return Assets::is_admin_page();
    }

    protected function get_app_script_handle()
    {
        if (app()->is_dev_mode()) {
            return app()->prefix() . 'app';
        }

        return app()->prefix() . 'bundle';
    }

    protected function get_dashicon_inline_styles()
    {
        $logo_url = esc_url(KIRKI_ECOMMERCE_ASSETS_URL . '/images/logo.svg');

        return sprintf(
            '.dashicons-kirki-ecommerce {
                background-image: url("%1$s");
                background-repeat: no-repeat;
                background-position: center;
                background-size: 18px 18px;
            }',
            $logo_url
        );
    }

    protected function get_root_shell_inline_styles()
    {
        return '.kirki-ecommerce-root {
                font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            /* Warm Inter 500/600 during the hidden shell so Emotion UI does not FOIT after reveal. */
            .kirki-ecommerce-root::before,
            .kirki-ecommerce-root::after {
                content: ".";
                position: absolute;
                width: 0;
                height: 0;
                overflow: hidden;
                opacity: 0;
                pointer-events: none;
                font-family: "Inter", sans-serif;
            }

            .kirki-ecommerce-root::before {
                font-weight: 500;
            }

            .kirki-ecommerce-root::after {
                font-weight: 600;
            }

            .kirki-ecommerce-root:not(.kirki-ecommerce-root--ready) {
                visibility: hidden;
                min-height: calc(100vh - 32px);
            }';
    }

    public function add_font_resource_hints($urls, $relation_type)
    {
        if ('preconnect' !== $relation_type || !$this->is_ecommerce_admin_page()) {
            return $urls;
        }

        $urls[] = [
            'href' => 'https://fonts.googleapis.com',
        ];

        $urls[] = [
            'href'        => 'https://fonts.gstatic.com',
            'crossorigin' => 'anonymous',
        ];

        return $urls;
    }

    public function render_page()
    {
        printf(
            '<div id="%1$s" class="%2$s"></div>',
            esc_attr('kirki-ecommerce-root'),
            esc_attr('kirki-ecommerce-root')
        );
    }
}
