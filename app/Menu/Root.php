<?php

namespace Kirki\Ecommerce\App\Menu;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\App\Supports\Assets;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

use function Kirki\Ecommerce\Framework\app;

/**
 * Registers the top-level eCommerce admin menu and loads the admin app shell assets.
 *
 * @since 1.0.0
 */
class Root extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::MAIN_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce';

    /** @inheritDoc */
    protected $position = 2;

    /** @inheritDoc */
    protected $icon_url = 'dashicons-kirki-ecommerce';

    /**
     * Set the menu titles and page callback, and hook the admin asset enqueueing.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->page_title = __('eCommerce', 'kirki-ecommerce');
        $this->menu_title = __('eCommerce', 'kirki-ecommerce');
        $this->callback = [$this, 'render_page'];

        parent::__construct();

        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets'], 20);
    }

    /**
     * Enqueue the menu icon style on every admin page and the app shell assets on the plugin's page.
     *
     * Hooked to `admin_enqueue_scripts`.
     *
     * @since 1.0.0
     *
     * @return void
     */
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

        $root_style_handle = app()->prefix() . 'root-shell';

        wp_register_style(
            $root_style_handle,
            false,
            [],
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

    /**
     * Get the handle of the admin app script: the dev-server script in dev mode, the bundle otherwise.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function get_app_script_handle()
    {
        if (app()->is_dev_mode()) {
            return app()->prefix() . 'app';
        }

        return app()->prefix() . 'bundle';
    }

    /**
     * Get the inline CSS that shows the plugin logo as the menu icon.
     *
     * @since 1.0.0
     *
     * @return string
     */
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

    /**
     * Get the inline CSS for the app mount element: font family and hidden state until ready.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function get_root_shell_inline_styles()
    {
        return '.kirki-ecommerce-root {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            }

            .kirki-ecommerce-root:not(.kirki-ecommerce-root--ready) {
                visibility: hidden;
                min-height: calc(100vh - 32px);
            }';
    }

    /**
     * Print the mount element for the admin app.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function render_page()
    {
        printf(
            '<div id="%1$s" class="%2$s"></div>',
            esc_attr('kirki-ecommerce-root'),
            esc_attr('kirki-ecommerce-root')
        );
    }
}
