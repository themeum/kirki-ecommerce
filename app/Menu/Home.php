<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

class Home extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce#/products';

    /** @inheritDoc */
    protected $parent_slug = 'kirki-ecommerce';

    public function __construct()
    {
        $this->page_title = __('Home', 'kirki-ecommerce');
        $this->menu_title = __('Home', 'kirki-ecommerce');

        parent::__construct();
    }

    public function render()
    {
        parent::render();

        // @todo: will be removed after the home menu is back
        add_action('admin_head', function () {
            echo '<style>
                #toplevel_page_kirki-ecommerce > ul.wp-submenu > li.wp-first-item {
                    display: none;
                }
            </style>';
        });
    }
}
