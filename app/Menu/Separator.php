<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

class Separator extends Menu
{
    /** @inheritDoc */
    protected $menu_type = MenuTypes::SUB_MENU;

    /** @inheritDoc */
    protected $capabilities = 'manage_options';

    /** @inheritDoc */
    protected $menu_slug = 'kirki-ecommerce#/';

    /** @inheritDoc */
    protected $parent_slug = 'kirki-ecommerce';

    public function __construct()
    {
        $this->page_title = __('Separator', 'kirki-ecommerce');
        $this->menu_title = __('<span class="kirki-menu-separator"></span>', 'kirki-ecommerce');

        parent::__construct();
    }

    public function render()
    {
        add_submenu_page(
            $this->parent_slug,
            $this->page_title,
            $this->menu_title,
            $this->capabilities,
            $this->menu_slug,
            '__return_false',
            $this->position
        );

        add_action('admin_head', function () {
            echo '<style>
                a:has(.kirki-menu-separator) {
                    width: 80%;
                    pointer-events: none;
                }

                .kirki-menu-separator {
                    display: block;
                    width: 100%;
                    height: 1px;
                    background-color: #4A5257;
                    pointer-events: none;
                    margin-block: 4px;
                }
            </style>';
        });
    }
}
