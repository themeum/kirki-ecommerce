<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Supports\Assets;
use Kirki\Ecommerce\Wordpress\Menu;

class Root extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::MAIN_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'ecommerce';

    protected $position = 2;

    protected $icon_url = 'dashicons-kirki-ecommerce';

    public function __construct()
    {
        $this->page_title = __('eCommerce', 'kirki-ecommerce');
        $this->menu_title = __('eCommerce', 'kirki-ecommerce');
        $this->callback = [$this, 'render_page'];

        parent::__construct();

        add_action('admin_head', function () {
            echo '<style>
                .dashicons-kirki-ecommerce {
                    background-image: url("' . KIRKI_ECOMMERCE_ASSETS_URL . '/images/logo.svg");
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: 18px 18px;
                }
            </style>';
        });
    }

    public function render_page()
    {
        $config = Assets::get_kirki_ecommerce_configs();
        echo '<div id="kirki-ecommerce-root" class="kirki-ecommerce-root">Kirki Ecommerce Root</div>';
        echo '<script>' . $config . '</script>';
    }
}
