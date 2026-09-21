<?php

namespace Kirki\Ecommerce\App\Menu;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

/**
 * Registers the Home submenu, which currently points at the products page.
 *
 * @since 1.0.0
 */
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

    /**
     * Set the Home page and menu titles.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->page_title = __('Home', 'kirki-ecommerce');
        $this->menu_title = __('Home', 'kirki-ecommerce');

        parent::__construct();
    }

    /**
     * Register the submenu page, then hide the first submenu item with an inline admin style.
     *
     * @since 1.0.0
     *
     * @return void
     */
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
