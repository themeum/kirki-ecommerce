<?php

namespace Kirki\Ecommerce\App\Menu;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Wordpress\Constants\MenuTypes;
use Kirki\Ecommerce\Framework\Wordpress\Menu;

/**
 * Registers the Home submenu, which opens the dashboard's Home page.
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
    protected $menu_slug = 'kirki-ecommerce#/';

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
}
